"use client";
import React, { useState } from "react";
import { Layout } from "antd";
const { Sider, Header, Content, Footer } = Layout;
import { useIsMobile } from "@/hooks/use-mobile";
import {Button }from "@/components/Button";
import { PanelTopCloseIcon, MenuIcon, X } from "lucide-react";

type AppLayoutProps = {
  sider: React.ReactNode;
  children: React.ReactNode;
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
}) => {
  const isMobile = useIsMobile();
  // Sidebar open state (collapsed/expanded)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Open sidebar when not mobile, close when mobile by default
  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="relative" style={{ background: colorBgContainer }}>
      {/* BACKDROP: show only when sidebar is open and mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[2999] transition-opacity duration-300"
          aria-label="Sidebar Backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Layout
        style={{
          background: colorBgContainer,
          position: "relative",
          maxHeight: "100vh",
          overflow: "scroll",
        }}
      >
        {/* SIDEBAR */}
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          collapsed={!sidebarOpen}
          style={{
            background: colorBgContainer,
            zIndex: zIndexSider,
            minHeight: "100vh",
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            position: isMobile ? "fixed" : "relative",
            top: 0,
            left: 0,
            width: 330,
            transition: "transform 0.3s",
            transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "none",
            maxWidth: "90vw",
          }}
          width={330}
          onCollapse={(collapsed, type) => {
            setSidebarOpen(!collapsed);
          }}
        >
          {/* Optionally add a close button for mobile */}
          {isMobile && (
            <button
              className="absolute top-6 right-4 text-white bg-black/30 p-2 rounded-full z-[9999]"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{ border: "none" }}
            >
            <X className="h-5 w-5" />
            </button>
          )}
          {sider}
        </Sider>

        {/* Main Layout */}
        <Layout title="hello" style={{ background: colorBgContainer }}>
          <Header
            style={{
              marginTop: 15,
              marginBottom: 10,
              paddingLeft: 15,
              paddingRight: 10,
              background: colorBgContainer,
              zIndex: 2,
            }}
          >
            {header ? header : ""}
            {isMobile && !sidebarOpen && (
              <button
                style={{
                  position: "absolute",
                  bottom: 340,
                  right: 20,
                  zIndex: 1000,
                  border: "none",
                }}
                className="ml-2 text-white bg-[#1C2951] p-2 cursor-pointer rounded"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            )}
          </Header>
          <Content style={{ margin: "0px ", background: colorBgContainer }}>
            <div
              style={{
                padding: isMobile ? 12 : 24,
                paddingTop: 0,
                minHeight: 360,
                background: colorBgContainer,
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
                position: "relative",
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
              paddingTop: 10,
              paddingBottom: 10,
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
};

export default AppLayout;
