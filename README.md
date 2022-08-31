# Sync Action

Mirrors a GitHub Git repository to Bitbucket. If no corresponding Bitbucket repository exists, it is created using the [Bitbucket API 2.0](https://developer.atlassian.com/bitbucket/api/2/reference/).

Make sure that you checkout the entire repository before using this. By default, `actions/checkout@v3` only creates a shallow clone. See section [example usage](https://github.com/eteg/testing-sync-action).