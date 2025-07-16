import React from 'react';
import { Card as AntdCard, CardProps } from 'antd';

export const Card: React.FC<CardProps> = ({ style, ...props }) => (
  <AntdCard
    style={{
      borderRadius: 16,
      boxShadow: '0 2px 24px 0 rgba(0,0,0,0.07)',
      ...style,
    }}
    {...props}
  />
);
