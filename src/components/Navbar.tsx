// Importing required modules and styles.
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

// TypeScript type definition for component's props.
interface Props {
  isDeployed: boolean | undefined; // Indicates if something (likely an application or feature) is deployed.
}

const Navbar = ({ isDeployed }: Props) => {
  return (
    <nav>
      <ul>
        {/* Navigation link to the root or "Create" route */}
        <li>
          <Link to="/">Create</Link>
        </li>
        {/* Navigation link to the "Consume" route */}
        <li>
          <Link to="/consume">Consume</Link>
        </li>
        {/* Conditional rendering of navigation link text based on `isDeployed` prop.
            If it's true, displays "Obey". Otherwise, displays "Deploy". */}
        <li>
          <Link to="/deploy">{isDeployed ? 'Obey' : 'Deploy'}</Link>
        </li>
      </ul>
    </nav>
  );
};

// Exporting Navbar component for use in other parts of the application.
export default Navbar;
