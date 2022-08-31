const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const shell = require('shelljs');
const axios = require('axios')

const USER = core.getInput('dst_user')
const PASS = core.getInput('dst_pass')
const REPO = 'testing'
const SRC_SSH =  core.getInput('src-ssh')

const AUTH_URL = `https://api.bitbucket.org/2.0/user`
const REPO_URL = `https://api.bitbucket.org/2.0/repositories/${USER}/${REPO}`

const auth = {
  username: USER,
  password: PASS
}

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

  shell.echo('Checking user...')

  shell.echo(`${github.event}`)
  shell.echo(`${ github.event.repository.name }`)

  const user = await axios.get(AUTH_URL, { auth } ).catch(error => {
    shell.echo('Failed, most likely, the provided credentials are invalid.')
    handleError(error)
    shell.exit(1)
  })

  shell.echo('Checking repository...')

  const repository = await axios.get(REPO_URL, { auth }).catch(async error => {
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
  
  shell.echo('Repository exists, adding ssh...')

  shell.exec(`mkdir -p ~/.ssh`)
  shell.exec(`echo ${SRC_SSH} > ~/.ssh/id_rsa`)
  shell.exec(`chmod 600 ~/.ssh/id_rsa`)

  shell.exec(`git config --list`)
}

init()