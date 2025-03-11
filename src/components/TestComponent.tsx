import React from 'react';

interface TestProps {
  message: string;
}

const TestComponent = ({ message }: TestProps) => {
  return <div>{message}</div>;
};

export default TestComponent;
