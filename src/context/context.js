import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });

  const searchGithubUser = async user => {
    toggleError();
    setIsLoading(true);
    try {
      const resp = await axios.get(`${rootUrl}/users/${user}`);
      setGithubUser(resp.data);

      // repos
      const { login, followers_url } = resp.data;

      // all set
      const settled = await Promise.allSettled([
        axios.get(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios.get(`${followers_url}?per_page=100`),
      ]);

      const [dataRepos, dataFollowers] = settled;
      const status = 'fulfilled';
      if (dataRepos.status === status) {
        setRepos(dataRepos.value.data);
      }
      if (dataFollowers.status === status) {
        setFollowers(dataFollowers.value.data);
      }

      setIsLoading(false);
      checkRequests();
    } catch (error) {
      toggleError(true, 'there is no user with that username');
      return error.response.data.message;
    }
  };

  // check rate
  const checkRequests = () => {
    axios
      .get(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        if (remaining === 0) {
          // throw error
          toggleError(true, 'sorry, you reach your hourly rate limit!');
        }
      })
      .catch(err => console.log(err));
  };

  const toggleError = (show = false, msg = '') => {
    setError({ show, msg });
  };

  useEffect(checkRequests, []);
  // error

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
