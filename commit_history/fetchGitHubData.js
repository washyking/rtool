import axios from 'axios';
import * as dotenv from 'dotenv';
import { createObjectCsvWriter } from 'csv-writer';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'preactjs'; // Replace with repository owner
const REPO_NAME = 'preact-www'; // Replace with repository name

const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
    },
});

// CSV Writers for commits and pull requests
const commitCsvWriter = createObjectCsvWriter({
    path: 'commits.csv',
    header: [
        { id: 'sha', title: 'SHA' },
        { id: 'author', title: 'Author' },
        { id: 'date', title: 'Date' },
        { id: 'message', title: 'Message' },
    ],
});

const pullRequestCsvWriter = createObjectCsvWriter({
    path: 'pull_requests.csv',
    header: [
        { id: 'number', title: 'PR Number' },
        { id: 'title', title: 'Title' },
        { id: 'author', title: 'Author' },
        { id: 'state', title: 'State' },
    ],
});

const fetchCommits = async () => {
    try {
        const response = await githubAPI.get(`/repos/${REPO_OWNER}/${REPO_NAME}/commits`);
        const commits = response.data.map((commit) => ({
            sha: commit.sha,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            message: commit.commit.message,
        }));

        console.log(`Fetched ${commits.length} commits.`);
        // Write to CSV
        await commitCsvWriter.writeRecords(commits);
        console.log('Commits saved to commits.csv');
    } catch (error) {
        console.error('Error fetching commits:', error.response?.data || error.message);
    }
};

const fetchPullRequests = async () => {
    try {
        const response = await githubAPI.get(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
            params: { state: 'all' }, // 'all' includes open, closed, and merged PRs
        });
        const pullRequests = response.data.map((pr) => ({
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            state: pr.state,
        }));

        console.log(`Fetched ${pullRequests.length} pull requests.`);
        // Write to CSV
        await pullRequestCsvWriter.writeRecords(pullRequests);
        console.log('Pull requests saved to pull_requests.csv');
    } catch (error) {
        console.error('Error fetching pull requests:', error.response?.data || error.message);
    }
};

const main = async () => {
    console.log('Fetching commit history...');
    await fetchCommits();
    console.log('\nFetching pull request history...');
    await fetchPullRequests();
};

main();
