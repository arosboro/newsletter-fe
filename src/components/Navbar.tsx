import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Create</Link>
        </li>
        <li>
          <Link to="/consume">Consume</Link>
        </li>
        <li>
          <Link to="/deploy">Deploy</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
