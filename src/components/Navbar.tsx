import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

interface Props {
  isDeployed: boolean | undefined;
}

const Navbar = ({ isDeployed }: Props) => {
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
          <Link to="/deploy">{isDeployed ? 'Obey' : 'Deploy'}</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
