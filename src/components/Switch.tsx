import React from 'react';
import { Switch as AntdSwitch, SwitchProps } from 'antd';

export const Switch: React.FC<SwitchProps> = (props) => (
  <AntdSwitch {...props} />
);
