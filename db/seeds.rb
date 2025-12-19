# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# We don't want to run seeds in production or test environments
return unless Rails.env.local?

User.create!(
  email_address: "foo@bar.com",
  password: "password",
)

10.times do |i|
  Note.create!(
    user: User.first,
      title: "Note ##{i + 1}",
      body: "This is note ##{i + 1}.",
    )
end
