import React from 'react';
import { Badge as AntdBadge, BadgeProps } from 'antd';

export const Badge: React.FC<BadgeProps> = (props) => (
  <AntdBadge {...props} />
);
