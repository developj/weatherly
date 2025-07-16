import React from 'react';
import { Slider as AntdSlider, SliderSingleProps } from 'antd';

export const Slider: React.FC<SliderSingleProps> = (props) => (
  <AntdSlider tooltip={{ open: false }} {...props} />
);
