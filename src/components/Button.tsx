import React from 'react';
import { Button as AntdButton, ButtonProps } from 'antd';

export const Button: React.FC<ButtonProps> = (props) => (
  <AntdButton
    type={props.type ?? "primary"}
    shape={props.shape ?? "round"}
    {...props}
  />
);
