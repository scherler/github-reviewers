import request, { post, delete as deleteRequest } from "request";

export type Igithub = {
  GIT_TOKEN: string;
  owner: string;
  repo: string;
  pr: string;
};

export const github = ({ owner, repo, pr, GIT_TOKEN }: Igithub) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr}/requested_reviewers`;
  const options = {
    url,
    headers: {
      "User-Agent": "request",
      Authorization: `token ${GIT_TOKEN}`
    }
  };

  const getReviewers = () => {
    request(options, (error, response, body) => {
      console.log(`List of current reviewers for 
https://github.com/${owner}/${repo}/pull/${pr}`);
      if (!error && response.statusCode == 200) {
        const info = JSON.parse(body);
        const reviewers = info.users.map(
          (user: { login: string }) => user.login
        );
        console.log("reviewers:", reviewers);
      } else {
        console.error("error", error, response, body);
      }
    });
  };

  const requestReviewers = (reviewers: string[]) => {
    const body = JSON.stringify({
      reviewers
    });
    post(
      {
        ...options,
        body
      },
      (error, response) => {
        console.log(`List of requested reviewers for 
https://github.com/${owner}/${repo}/pull/${pr}`);
        if (!error && response.statusCode == 201) {
          console.log("requested reviewers:", reviewers);
        } else {
          console.error("error", error, response);
        }
      }
    );
  };

  const deleteReviewers = (reviewers: string[]) => {
    const body = JSON.stringify({
      reviewers
    });
    deleteRequest(
      {
        ...options,
        body
      },
      (error, response) => {
        console.log(`List of deleted reviewers for 
https://github.com/${owner}/${repo}/pull/${pr}`);
        if (!error && response.statusCode == 200) {
          console.log("removed reviewers:", reviewers);
        } else {
          console.error("error", error);
        }
      }
    );
  };

  return {
    deleteReviewers,
    getReviewers,
    requestReviewers
  };
};
