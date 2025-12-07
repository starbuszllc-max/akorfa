import React from 'react';

export default function ShadCard({children, className = ''}:{children:React.ReactNode, className?:string}){
  return <div className={`card ${className}`}>{children}</div>;
}
