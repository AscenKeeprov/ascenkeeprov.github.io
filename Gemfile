source "https://rubygems.org"

ruby ">= 2.5"

gem "github-pages", ">= 204", :group => :jekyll_plugins
#Are these two needed at all for a non-blog site ???
gem "netrc", "~> 0.11.0"
gem "wdm", "~> 0.1.1", :install_if => Gem.win_platform?

#group :jekyll_plugins do
#  gem "jekyll-assets"
#  gem "jekyll-sitemap"
#end

install_if -> { RUBY_PLATFORM =~ %r!java|mingw|mswin! } do
  gem "tzinfo"
  gem "tzinfo-data"
end
