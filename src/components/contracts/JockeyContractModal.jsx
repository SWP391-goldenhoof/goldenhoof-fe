import { useState } from "react";
import { Button, Input, Modal, Tag, Radio, Typography, message } from "antd";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const statusColor = {
  ACTIVE: "green",
  COMPLETED: "green",
  CANCELLED: "red",
  BREACHED: "red",
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function formatContractDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm") : value;
}

function getInitial(value) {
  return String(value || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function PartyCard({ label, name, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minWidth: 0,
        padding: 18,
        border: `1px solid ${accent.border}`,
        borderRadius: 12,
        background: accent.background,
        boxShadow: "0 6px 18px rgba(6, 51, 46, 0.06)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          flex: "0 0 46px",
          width: 46,
          height: 46,
          placeItems: "center",
          borderRadius: "50%",
          color: "#fff",
          background: accent.avatar,
          fontSize: 20,
          fontWeight: 800,
        }}
      >
        {getInitial(name)}
      </div>

      <div style={{ minWidth: 0 }}>
        <Typography.Text
          style={{
            display: "block",
            marginBottom: 3,
            color: accent.label,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography.Text>
        <Typography.Text
          strong
          ellipsis={{ tooltip: name || "N/A" }}
          style={{ display: "block", color: "#123d38", fontSize: 16 }}
        >
          {name || "N/A"}
        </Typography.Text>
      </div>
    </div>
  );
}

function TermCard({ label, value }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        border: "1px solid #dcebe8",
        borderRadius: 10,
        background: "#fbfefd",
      }}
    >
      <Typography.Text
        type="secondary"
        style={{ display: "block", marginBottom: 4, fontSize: 12 }}
      >
        {label}
      </Typography.Text>
      <Typography.Text strong style={{ color: "#174e47", fontSize: 17 }}>
        {value ?? 0}%
      </Typography.Text>
    </div>
  );
}

export default function JockeyContractModal({
  contract,
  onCancel,
  cancellingParty,
  onCancelContract,
}) {
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionType, setActionType] = useState("SELF_CANCEL");
  const contractStatus = String(contract?.status || "").toUpperCase();
  const cancellationDisabled = ["CANCELLED", "COMPLETED", "BREACHED"].includes(
    contractStatus,
  );
  const opponentParty =
    cancellingParty === "HORSE_OWNER" ? "JOCKEY" : "HORSE_OWNER";

  function handleClose() {
    setCancellationModalOpen(false);
    setCancellationReason("");
    setActionType("SELF_CANCEL");
    onCancel?.();
  }

  // Hàm xử lý xuất file PDF
  function handleDownloadPDF() {
    const element = document.getElementById("contract-pdf-content");
    if (!element) {
      message.error("Could not find contract content.");
      return;
    }

    setDownloading(true);
    const contractId = contract?._id || contract?.id || "Contract";

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Jockey_Contract_${contractId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setDownloading(false);
        message.success("Contract downloaded successfully.");
      })
      .catch((err) => {
        console.error(err);
        setDownloading(false);
        message.error("Failed to download PDF contract.");
      });
  }

  async function handleCancelContract() {
    const reason = cancellationReason.trim();
    const contractId = contract?._id || contract?.id;

    if (!contractId) {
      message.error("Missing contract ID.");
      return;
    }

    if (reason.length < 10) {
      message.warning("Please enter a reason of at least 10 characters.");
      return;
    }

    setCancellationLoading(true);

    try {
      const breachingParty =
        actionType === "SELF_CANCEL" ? cancellingParty : opponentParty;
      await onCancelContract({
        contractId,
        actionType,
        breachingParty,
        reason,
      });
      message.success(
        actionType === "SELF_CANCEL"
          ? "Contract cancelled successfully."
          : "Report submitted successfully.",
      );
      handleClose();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Could not cancel contract.",
      );
    } finally {
      setCancellationLoading(false);
    }
  }

  return (
    <>
      <Modal
        title={null}
        open={Boolean(contract)}
        footer={null}
        onCancel={handleClose}
        destroyOnHidden
        width={800}
        closable={false}
      >
        {contract && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Nút Download PDF ở góc trên bên phải */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                loading={downloading}
                onClick={handleDownloadPDF}
                style={{
                  background: "#087a6d",
                  borderColor: "#087a6d",
                  fontWeight: 600,
                }}
              >
                Download
              </Button>
            </div>

            {/* Vùng HTML sẽ xuất thành file PDF */}
            <div
              id="contract-pdf-content"
              style={{
                overflow: "hidden",
                border: "1px solid #ccefe7",
                borderRadius: 14,
                background: "#fff",
              }}
            >
              <div
                style={{
                  padding: "28px 30px",
                  color: "#fff",
                  background: "linear-gradient(135deg, #06332e, #087a6d)",
                  textAlign: "center",
                }}
              >
                <Typography.Text
                  style={{
                    color: "#69f8dd",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                  }}
                >
                  GOLDENHOOF OFFICIAL AGREEMENT
                </Typography.Text>
                <Typography.Title
                  level={2}
                  style={{ margin: "8px 0 12px", color: "#fff" }}
                >
                  Jockey Service Contract
                </Typography.Title>
                <Tag color={statusColor[contract.status] || "default"}>
                  {contract.status || "N/A"}
                </Tag>
              </div>

              <div style={{ padding: 28 }}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  Contract parties
                </Typography.Title>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 14,
                  }}
                >
                  <PartyCard
                    label="Horse Owner"
                    name={contract.ownerName}
                    accent={{
                      border: "#b9e4da",
                      background: "#f0fbf8",
                      avatar: "linear-gradient(135deg, #075e54, #0fa58f)",
                      label: "#087a6d",
                    }}
                  />
                  <PartyCard
                    label="Jockey"
                    name={contract.jockeyName}
                    accent={{
                      border: "#c8dcf4",
                      background: "#f3f8fe",
                      avatar: "linear-gradient(135deg, #245b91, #4b8bc8)",
                      label: "#356d9f",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 14,
                    marginTop: 14,
                    padding: "14px 16px",
                    border: "1px solid #e2ecea",
                    borderRadius: 10,
                    background: "#fafcfb",
                  }}
                >
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Horse
                    </Typography.Text>
                    <Typography.Text
                      strong
                      style={{ display: "block", marginTop: 2 }}
                    >
                      {contract.horseName || "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Tournament
                    </Typography.Text>
                    <Typography.Text
                      strong
                      style={{ display: "block", marginTop: 2 }}
                    >
                      {contract.tournamentName || "N/A"}
                    </Typography.Text>
                  </div>
                </div>

                <Typography.Title level={5} style={{ marginTop: 26 }}>
                  Financial terms
                </Typography.Title>
                <div
                  style={{
                    width: "100%",
                    marginBottom: 14,
                    padding: "18px 20px",
                    border: "1px solid #9bd6c9",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #e8f8f4, #f7fcfa)",
                  }}
                >
                  <Typography.Text
                    style={{
                      display: "block",
                      marginBottom: 4,
                      color: "#52726e",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Contract Amount
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{ color: "#087a6d", fontSize: 24 }}
                  >
                    {formatMoney(contract.contractAmount)}
                  </Typography.Text>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                  }}
                >
                  <TermCard
                    label="Owner Share"
                    value={contract.ownerShareRate}
                  />
                  <TermCard
                    label="Jockey Share"
                    value={contract.jockeyShareRate}
                  />
                  <TermCard
                    label="Owner Compensation"
                    value={contract.ownerCompensationRate}
                  />
                  <TermCard
                    label="Jockey Compensation"
                    value={contract.jockeyCompensationRate}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 24,
                    paddingTop: 18,
                    borderTop: "1px solid #d9eee9",
                    color: "#52726e",
                    fontSize: 13,
                  }}
                >
                  <span>Signed: {formatContractDate(contract.signedAt)}</span>
                  <span>
                    Contract ID: {contract._id || contract.id || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Khối xử lý hủy hợp đồng (nằm ngoài vùng PDF) */}
            {onCancelContract && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  marginTop: 8,
                  padding: 16,
                  border: "1px solid #ffd2d2",
                  borderRadius: 10,
                  background: "#fff7f7",
                }}
              >
                <div>
                  <Typography.Text strong style={{ display: "block" }}>
                    Contract cancellation
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Cancel this contract as the current contract party.
                  </Typography.Text>
                </div>
                <Button
                  danger
                  disabled={cancellationDisabled}
                  onClick={() => setCancellationModalOpen(true)}
                >
                  Cancel contract
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          actionType === "SELF_CANCEL"
            ? "Cancel Contract"
            : "Report Opponent Violation"
        }
        open={cancellationModalOpen}
        okText={
          actionType === "SELF_CANCEL" ? "Submit Cancellation" : "Submit Report"
        }
        okButtonProps={{ danger: true }}
        confirmLoading={cancellationLoading}
        styles={{
          body: { paddingBottom: 4 },
          footer: { marginTop: 28 },
        }}
        onOk={handleCancelContract}
        onCancel={() => {
          if (!cancellationLoading) {
            setCancellationModalOpen(false);
            setCancellationReason("");
            setActionType("SELF_CANCEL");
          }
        }}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          Select action type and enter a clear reason.
        </Typography.Paragraph>
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
            Action Type:
          </Typography.Text>
          <Radio.Group
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="SELF_CANCEL">
              Self Cancel (Your fault)
            </Radio.Button>
            <Radio.Button value="REPORT_OPPONENT">Report Opponent</Radio.Button>
          </Radio.Group>
        </div>
        <div style={{ paddingBottom: 18 }}>
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
            Reason:
          </Typography.Text>
          <Input.TextArea
            value={cancellationReason}
            rows={4}
            maxLength={500}
            showCount
            placeholder={
              actionType === "SELF_CANCEL"
                ? "Describe why you are cancelling..."
                : "Describe how the opponent breached the contract..."
            }
            onChange={(event) => setCancellationReason(event.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
