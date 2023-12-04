import { Octokit } from '@octokit/rest'
import parseLinkHeader from 'parse-link-header'
import yargs from 'yargs'

const args = yargs(process.argv.slice(2))
    .scriptName('GHA run cleaner')
    .version(false)
    .options({
        'owner': {
            alias: 'o',
            description: 'Owner of GitHub repository to clean',
            demandOption: true,
            type: 'string',
        },
        'repository': {
            alias: 'r',
            description: 'GitHub repository to clean',
            demandOption: true,
            type: 'string',
        },
        'token': {
            alias: 't',
            description: 'GitHub access token',
            demandOption: true,
            type: 'string'
        },
        'delete-older-than': {
            description: 'Delete runs older than this (days)',
            type: 'number',
            default: 30
        },
        'delete-run-names': {
            description: 'Delete runs with these names',
            type: 'array',
            default: ['automerge']
        },
        'include-pull-requests': {
            description: 'If not set, will skip runs triggered by pull requests',
            type: 'boolean',
            default: false
        }
    })
    .parseSync()

const gh = new Octokit({ auth: args.token })
const start = new Date()
const per_page = 100;

// State
let offset = 0;
let page = 1;
let lastPage

function retainRun(run, reason) {
    console.log(`Retained ${run.name} (${reason})`)
    if (++offset == per_page) {
        offset = 0
        page++
    }
}

async function deleteRun(run, reason) {
    console.log(`Deleting ${run.name} (${reason})`)
    await gh.rest.actions.deleteWorkflowRun({
        owner: args.owner,
        repo: args.repository,
        run_id: run.id
    })
}

do {
    const res = await gh.rest.actions.listWorkflowRunsForRepo({
        owner: args.owner,
        repo: args.repository,
        page, per_page
    })
    lastPage = res.headers.link ? parseLinkHeader(res.headers.link).last.page : 1

    console.log(`Remaining: ${res.data.total_count}`)
    console.log(`Rate limit: ${res.headers['x-ratelimit-remaining']} until ${new Date(parseInt(res.headers['x-ratelimit-reset']) * 1000).toISOString()}`)
    console.log(`Page: ${page}/${lastPage}`)

    for (const r of res.data.workflow_runs.slice(offset)) {
        const date = new Date(r.created_at)
        const age = parseInt((start.getTime() - date.getTime()) / 1000 / 3600 / 24) // In days

        if (!args.includePullRequests && r.event === 'pull_request') {
            retainRun(r, 'pull requests not included')
        } else if (age > args.deleteOlderThan) {
            await deleteRun(r, `${date.toISOString().substring(0, 10)} is ${age} days old`)
        } else if (args.deleteRunNames.includes(r.name)) {
            await deleteRun(r, 'name is in the list')
        } else {
            retainRun(r, 'no filter matched')
        }
    }
} while (lastPage > page)
