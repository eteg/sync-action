const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const shell = require('shelljs');
const axios = require('axios')

function handleError(error) {
  if (error.response) {
    const { status, statusText, data } = error.response
    shell.echo(`Response Error: ${status} - ${statusText}`)

    if (data) shell.echo(data)

  } else if (error.request) {
    shell.echo('Request Error', error.request)
  } else {
      shell.echo('Error', error.message);
  }
}

async function init() {
  const dateTime = (new Date()).toLocaleString('pt-BR');

  const { 
    ref,
    eventName
  } = github.context;

  const {
    repository
  } = github.context.payload
  
  shell.echo(`💡 Job started at ${dateTime}`);
  shell.echo(`🖥️ Job was automatically triggered by ${eventName} event`);
  shell.echo(`🔎 The name of your branch is ${ref} and your repository is ${repository.name}.`)

  shell.echo('Checking user...')

  const USER = core.getInput('DST_USER')
  const PASS = core.getInput('DST_PASS')
  const SRC_SSH = core.getInput('DST_SSH')
  const AUTH_URL = `https://api.bitbucket.org/2.0/user`
  const REPO_URL = `https://api.bitbucket.org/2.0/repositories/${USER}/${repository.name}`
  const KNOWN_HOSTS = core.getInput('KNOWN_HOSTS')

  const auth = {
    username: USER,
    password: PASS
  }

  const user = await axios.get(AUTH_URL, { auth } ).catch(error => {
    shell.echo('Failed, most likely, the provided credentials are invalid.')
    handleError(error)
    shell.exit(1)
  })

  shell.echo('Checking repository...')

  const repo = await axios.get(REPO_URL, { auth } ).catch(async error => {
    handleError(error)

    shell.echo('Repository does not exist, creating it...')

    await axios.post(REPO_URL, { 
      scm: 'git',
      private: true
    }, { auth }).catch(error => {
      handleError(error)
      shell.exit(1)
    })
  })

  shell.exec(`mkdir -p ~/.ssh`)
  shell.exec(`echo "${SRC_SSH}" > ~/.ssh/id_rsa`)
  shell.exec(`eval ssh-agent -s`)
  shell.exec(`eval $(ssh-agent -s)`)
  shell.exec(`ssh-add ~/.ssh/id_rsa`)
  shell.exec(`echo "${KNOWN_HOSTS}" > ~/.ssh/known_hosts`)
  
  shell.exec(`chmod 400 ~/.ssh/id_rsa`)
  
  shell.exec(`git config --global credential.username "${USER}"`)

  if (KNOWN_HOSTS) {
    shell.exec(`git config --global core.sshCommand "ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes -o UserKnownHostsFile=~/.ssh/known_hosts"`)
  } else {
    shell.exec(`git config --global core.sshCommand "ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"`)
  }

  shell.exec('git status')
  shell.exec('git add .')
  
  shell.exec(`git remote add mirror git@bitbucket.org:${USER}/${repository.name}.git`)
  shell.exec(`git push --tags --force --prune mirror refs/remotes/origin/*:refs/heads/*`)

}

init()