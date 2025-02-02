json.extract!(
  project,
  :status, :id, :blueprint_id, :data, :slug, :title, :created_at, :updated_at,
  :preview_url, :publish_url, :user_id, :published_at, :data_updated_at,
  :blueprint_version, :blueprint_config)

json.blueprint_title project.blueprint.title
json.theme project.theme.value
json.created_by project.user.name

# Only send build script output to superusers
json.output project.output if role? :superuser
