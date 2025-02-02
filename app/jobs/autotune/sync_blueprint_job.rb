require 'work_dir'

module Autotune
  # setup the blueprint
  class SyncBlueprintJob < ActiveJob::Base
    queue_as :default

    # do the deed
    def perform(blueprint)
      # Create a new repo object based on the blueprints working dir
      repo = WorkDir.repo(blueprint.working_dir,
                          Rails.configuration.autotune.setup_environment)
      if repo.exist?
        # Update the repo
        repo.update
      else
        # Clone the repo
        repo.clone(blueprint.repo_url)
      end

      # Setup the environment
      repo.setup_environment

      # Load the blueprint config file into the DB
      blueprint.config = repo.read BLUEPRINT_CONFIG_FILENAME

      # look in the config for stuff like descriptions, sample images, tags
      blueprint.initialize_tags_from_config

      # Associate themes
      blueprint.initialize_themes_from_config

      # Get the type from the config
      blueprint.type = blueprint.config['type'].downcase

      # Track the current commit version
      blueprint.version = repo.version

      # Stash the thumbnail
      if blueprint.config['thumbnail'] && repo.exist?(blueprint.config['thumbnail'])
        WorkDir.website(blueprint.working_dir).deploy_file(
          blueprint.config['thumbnail'],
          File.join(Rails.configuration.autotune.media[:connect], blueprint.slug))
      end

      # Blueprint is now ready for testing
      blueprint.status = 'testing'
      blueprint.save!
    rescue => exc
      # If the command failed, raise a red flag
      logger.error(exc)
      blueprint.update!(:status => 'broken')
      raise
    end
  end
end
