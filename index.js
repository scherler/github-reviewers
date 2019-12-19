#! /usr/bin/env node
const config = require('config');
const yargs = require('yargs');
const _ = require('lodash');
const request = require('request');

const GIT_TOKEN = process.env.GIT_TOKEN;

if (GIT_TOKEN == null) {
    console.error(
        '\nError: You need to set a GitHub token before running the command, like:\n\nGIT_TOKEN=XXXX node',
        __filename
    );
    return -1;
}
try {

    config.get('groups');
} catch (error) {
    const sample = {
        "owner": "OWNER",
        "repo": "REPO",
        "groups": {
            "devs": [
                "SOME_AUTHOR",
            ]
        }
    }
    console.error(`ERROR: NODE_CONFIG is not defiened.

Either create a default.json file as described in the node-config documentation or pass it as environment variable e.g.
NODE_CONFIG='${JSON.stringify(sample)}' node
    `);
    return -1
}

const github = (owner, repo, pr) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/requested_reviewers`;
    const options = {
        url,
        headers: {
            'User-Agent': 'request',
            Authorization: `token ${GIT_TOKEN}`,
        },
    };

    const getReviewers = () => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const info = JSON.parse(body);
                const reviewers = info.users.map(user => user.login);
                console.log('reviewers:', reviewers);
            } else {
                console.error('error', error, response, body);
            }
        });
    };

    const requestReviewers = reviewers => {
        const body = JSON.stringify({
            reviewers,
        });
        request.post(
            {
                ...options,
                body,
            },
            (error, response) => {
                if (!error && response.statusCode == 201) {
                    console.log('requested reviewers:', reviewers);
                } else {
                    console.error('error', error, response);
                }
            }
        );
    };

    const deleteReviewers = reviewers => {
        const body = JSON.stringify({
            reviewers,
        });
        request.delete(
            {
                ...options,
                body,
            },
            (error, response) => {
                if (!error && response.statusCode == 200) {
                    console.log('removed reviewers:', reviewers);
                } else {
                    console.error('error', error);
                }
            }
        );
    };

    return {
        deleteReviewers,
        getReviewers,
        requestReviewers,
    };
};

const groups = config.get('groups');

groups.all = _.flatten(_.map(groups, 'group'));

const allowedGroups = _.keys(groups);

const owner = config.get('owner');
const repo = config.get('repo');

const githubReviewer = pr => {
    return github(owner, repo, pr);
};

const pr = {
    describe: `Which pull request?
  https://github.com/${owner}/${repo}/pull/{THIS_NUMBER}`,
    type: 'number',
    demandOption: true,
};

const group = {
    describe: 'Choose a group of reviewers.',
    choices: allowedGroups,
    demandOption: true,
};

const deleteGroupCommand = {
    command: ['delete-group <pr> <group>', 'dg'],
    desc: 'Delete the members of a group as reviewer.',
    builder: yargs => {
        yargs.positional('pr', pr).positional('group', group);
    },
    handler: argv => {
        githubReviewer(argv.pr).deleteReviewers(groups[argv.group]);
    },
};

const addGroupCommand = {
    command: ['add-group <pr> <group>', 'ag'],
    desc: 'Request the members of a group as reviewer.',
    builder: yargs => {
        yargs.positional('pr', pr).positional('group', group);
    },
    handler: argv => {
        githubReviewer(argv.pr).requestReviewers(groups[argv.group]);
    },
};

const addCommand = {
    command: ['add <pr>', 'a'],
    desc: 'Request a list of reviewers.',
    builder: yargs => {
        yargs.positional('pr', pr).option('list', {
            alias: 'l',
            describe: 'Array of reviewers to be added.',
            type: 'array',
            demandOption: true,
        });
    },
    handler: argv => {
        githubReviewer(argv.pr).requestReviewers(argv.list);
    },
};

const deleteCommand = {
    command: ['delete <pr>', 'd'],
    desc: 'Remove the specific reviewers.',
    builder: yargs => {
        yargs.positional('pr', pr).option('list', {
            alias: 'l',
            describe: 'Array of reviewers to be removed.',
            type: 'array',
            demandOption: true,
        });
    },
    handler: argv => {
        githubReviewer(argv.pr).deleteReviewers(argv.list);
    },
};

const listCommand = {
    command: ['list <pr>', 'l'],
    desc: 'Show the reviewers currently requested.',
    builder: yargs => {
        yargs.positional('pr', pr);
    },
    handler: argv => {
        githubReviewer(argv.pr).getReviewers();
    },
};

const defaultCommand = {
    command: '$0',
    desc: 'List reviewers currently requested on a pull request or request/delete a specific group of reviewer.\n',
    builder: () => { },
    handler: argv => {
        console.log(`
Error: Command '${argv._[0]}' not found
  
Please start with '-h' for help.`);
    },
};

yargs
    .command(defaultCommand)
    .command(addCommand)
    .command(addGroupCommand)
    .command(deleteGroupCommand)
    .command(deleteCommand)
    .command(listCommand)
    .demandCommand()
    .help()
    .alias('help', 'h').argv;
