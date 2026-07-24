import { Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export default function WorkspaceHeader({
  kicker,
  title,
  subtitle,
  action,
  onRefresh,
  refreshLoading,
}) {
  return (
    <header className="workspace-page-header">
      <div>
        {kicker ? <div className="workspace-page-kicker">{kicker}</div> : null}
        <Typography.Title level={1} className="workspace-page-title">
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Text type="secondary" className="workspace-page-subtitle">
            {subtitle}
          </Typography.Text>
        ) : null}
      </div>
      {action ||
        (onRefresh ? (
          <Button
            className="workspace-page-refresh"
            icon={<ReloadOutlined />}
            loading={refreshLoading}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        ) : null)}
    </header>
  );
}
