module Autotune
  # Template tags!
  module ApplicationHelper
    def config
      {
        :env => Rails.env,
        :themes => current_user.nil? ? [] : current_user.author_themes.as_json,
        :user => current_user.as_json,
        :tags => Tag.all.as_json(:only => [:title, :slug]),
        :project_statuses => Autotune::PROJECT_STATUSES,
        :blueprint_statuses => Autotune::BLUEPRINT_STATUSES,
        :spinner => ActionController::Base.helpers.asset_path('autotune/spinner.gif'),
        :faq_url => Rails.configuration.autotune.faq_url
      }
    end
  end
end
