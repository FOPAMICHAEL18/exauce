import React from 'react';

const Link = ({ children, href, onClick, className, ...props }: any) => {
  return (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  );
};

export default Link;