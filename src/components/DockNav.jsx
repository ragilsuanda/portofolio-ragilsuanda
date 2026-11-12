import { useState, useEffect } from 'react';
import './DockNav.css';

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',       href: '#home'    },
  { id: 'about',   label: 'About',      href: '#about'   },
  { id: 'project', label: 'Project',    href: '#project' },
   { id: 'myjourney', label: 'myjourney',    href: '#myjourney' },
  { id: 'contact', label: 'Contact', href: '#contact' },

];

export default function DockNav() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const sections = ['home', 'about', 'project', 'contact'];
    const onScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - window.innerHeight / 2) {
          setActive(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (id, href) => {
    setActive(id);
    if (id === 'home') {
      // Section 1 fixed — scroll ke paling atas
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="dock-nav">
      <ul className="dock-menu">
        {NAV_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={`dock-link${active === item.id ? ' active' : ''}`}
              onClick={() => handleClick(item.id, item.href)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
