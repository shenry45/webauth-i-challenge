import React from 'react';
import axios from 'axios';

class LoginForm extends React.Component {

  logIn = (user, pass) => {
    const userTry = {
      user,
      pass
    }

    axios.post('http://localhost.com/api/login', userTry)
      .then(res => console.log(res))
      .catch(err => console.log(err.message));
  }

  render() {
    return (
      <form>
        <label>Username</label>
        <input
          name="username"
        ></input>
        <label>Password</label>
        <input
          name="password"
        ></input>
        <button
          type="submit"
          onClick={console.log('clicked submit')}
        >Log In</button>
      </form>
    )
  }
}

export default LoginForm;