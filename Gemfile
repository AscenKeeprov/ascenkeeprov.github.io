source "https://rubygems.org"

ruby ">= 2.5"

gem "github-pages", ">= 198", :group => :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-assets"
end

install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
  gem "tzinfo"
  gem "tzinfo-data"
end

# Prevents constant polling for directory changes on Windows
  gem "wdm", "~> 0.1.1", :install_if => Gem.win_platform?