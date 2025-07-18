"use client";
import React from "react";
import { Layout } from "antd";
const { Sider, Header, Content, Footer } = Layout;

type AppLayoutProps = {
  sider: React.ReactNode;
  children: React.ReactNode; // Main content
  footer?: React.ReactNode;
  header?: React.ReactNode;
  zIndexSider?: number;
  colorBgContainer?: string;
  borderRadiusLG?: number | string;
};

const AppLayout: React.FC<AppLayoutProps> = ({
  sider,
  children,
  footer,
  zIndexSider = 3000,
  colorBgContainer = "#1C2951",
  header = null,
}) => (
  <div>
    <Layout
      style={{
        minHeight: "100vh",
        position: "relative",
        background: colorBgContainer,
      }}
    >
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: colorBgContainer,
          zIndex: zIndexSider,
          minHeight: "100vh",
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
        width={320}
        onBreakpoint={(broken) => {
          // optional: handle responsive collapse
          console.log("Sider breakpoint:", broken);
        }}
        onCollapse={(collapsed, type) => {
          // optional: handle collapse
          console.log("Sider collapsed:", collapsed, "type:", type);
        }}
      >
        {sider}
      </Sider>
      <Layout style={{ background: colorBgContainer }}>
        <Header style={{ marginTop: 15, marginBottom:10, paddingLeft: 15, paddingRight: 15, background: colorBgContainer }}>
          {" "}
          {header ? header : ""}
        </Header>
        <Content style={{ margin: "0px ", background: colorBgContainer }}>
          <div
            style={{
              padding: 24,
              paddingTop: 0,
              minHeight: 360,
              background: colorBgContainer,
            }}
          >
            {children}
          </div>
        </Content>
        <Footer
          style={{
            textAlign: "center",
            background: colorBgContainer,
            color: "#fff",
          }}
        >
          {footer ?? (
            <>copyright ©{new Date().getFullYear()} Created by Jeshurun</>
          )}
        </Footer>
      </Layout>
    </Layout>
  </div>
);

export default AppLayout;
