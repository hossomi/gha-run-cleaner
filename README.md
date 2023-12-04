A simple script to cleanup GitHub Actions workflow runs.

## Requirements

- NodeJS
- NPM
- A [GitHub access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
- Write access to the repository you want to clean

## Usage:

| ![](https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Warning.svg/156px-Warning.svg.png) | This script will make one request for each run to delete and will probably hit your [rate limit](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api). It will stop if that happens. |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

Running with default arguments will delete all runs older than 30 days or named `automerge`, excluding runs triggered by PRs:
```bash
npm run clean -- -o {repository owner} -r {repository} -t {github token}
```

Additional options:
> **NOTE:** to be deleted, a run needs to satisfy ANY of `delete-*` filters and satisfy ALL `include-*` filters

| Option                                   | Description                       |
| ---------------------------------------- | --------------------------------- |
| `--delete-older-than {days}`             | Delete runs older than given days |
| `--delete-run-names {name1} {name2} ...` | Delete runs with given names      |
| `--include-pull-requests`                | Include runs triggered by PRs     |