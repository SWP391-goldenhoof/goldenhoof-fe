import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  createRaceCourse,
  deleteRaceCourse,
  getRaceCourseById,
  getRaceCourses,
  updateRaceCourse,
} from "../../api/services/race-course.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

dayjs.extend(utc);

const { Text, Title } = Typography;

const TRACK_TYPES = ["Dirt", "Turf", "Synthetic"];

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.raceCourses)) return response.raceCourses;
  return [];
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : value;
}


function getTimeValue(value) {
  if (!value) return 0;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeTrackType(value) {
  const normalizedValue = String(value || "").toLowerCase();

  return (
    TRACK_TYPES.find(
      (trackType) => trackType.toLowerCase() === normalizedValue,
    ) ||
    value ||
    "N/A"
  );
}

function normalizeRaceCourse(item, index) {
  const id = item?._id || item?.id || `race-course-${index}`;

  return {
    key: id,
    id,
    name: item?.name || "N/A",
    location: item?.location || "N/A",
    trackType: normalizeTrackType(item?.trackType),
    distance: item?.distance ?? 0,
    description: item?.description || "N/A",
    createdAt: item?.createdAt || "",
  };
}

function sortNewestFirst(a, b) {
  return getTimeValue(b.createdAt) - getTimeValue(a.createdAt);
}

function RaceCourseManagement() {
  const [courseForm] = Form.useForm();

  const [raceCourses, setRaceCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadRaceCourses() {
    setIsLoading(true);

    try {
      const response = await getRaceCourses();
      setRaceCourses(
        resolveList(response).map(normalizeRaceCourse).sort(sortNewestFirst),
      );
    } catch (error) {
      message.error(error?.message || "Unable to load race courses");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRaceCourses();
  }, []);

  function openCreateModal() {
    setEditingCourse(null);
    courseForm.resetFields();
    courseForm.setFieldsValue({
      trackType: "Turf",
    });
    setIsCourseModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCourse(record);
    courseForm.resetFields();
    courseForm.setFieldsValue({
      name: record.name !== "N/A" ? record.name : "",
      location: record.location !== "N/A" ? record.location : "",
      trackType: normalizeTrackType(record.trackType),
      distance: record.distance || undefined,
      description: record.description !== "N/A" ? record.description : "",
    });
    setIsCourseModalOpen(true);
  }

  async function openDetailModal(record) {
    setIsLoading(true);

    try {
      const response = await getRaceCourseById(record.id);
      setDetailCourse(normalizeRaceCourse(response, 0));
    } catch (error) {
      message.error(error?.message || "Unable to load race course detail");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveCourse() {
    const values = await courseForm.validateFields();

    setIsSaving(true);

    try {
      if (editingCourse) {
        await updateRaceCourse(editingCourse.id, values);
        message.success("Race course updated");
      } else {
        await createRaceCourse(values);
        message.success("Race course created");
      }

      setIsCourseModalOpen(false);
      setEditingCourse(null);
      courseForm.resetFields();
      await loadRaceCourses();
    } catch (error) {
      message.error(error?.message || "Unable to save race course");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCourse(record) {
    setIsSaving(true);

    try {
      await deleteRaceCourse(record.id);
      message.success("Race course deleted");
      await loadRaceCourses();
    } catch (error) {
      message.error(error?.message || "Unable to delete race course");
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Race Course",
        dataIndex: "name",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 260,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Location",
        dataIndex: "location",
        width: 180,
      },
      {
        title: "Track Type",
        dataIndex: "trackType",
        width: 140,
        render: (trackType) => <Tag color="green">{trackType}</Tag>,
      },
      {
        title: "Distance",
        dataIndex: "distance",
        width: 130,
        render: (distance) => `${Number(distance).toLocaleString("vi-VN")} m`,
      },
      {
        title: "Description",
        dataIndex: "description",
        width: 420,
        ellipsis: true,
      },
      // {
      //   title: "Created At",
      //   dataIndex: "createdAt",
      //   width: 180,
      //   render: formatDate,
      // },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 280,
        render: (_, record) => (
          <Space>
            <Button
              className="race-course-management-link-btn"
              size="small"
              onClick={() => openDetailModal(record)}
            >
              Detail
            </Button>

            <Button
              className="race-course-management-link-btn"
              size="small"
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>

            <Popconfirm
              title="Delete race course?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isSaving }}
              onConfirm={() => handleDeleteCourse(record)}
            >
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [isSaving, shouldFixColumns],
  );

  return (
    <section className="race-course-management">
      <style>{`
        .race-course-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .race-course-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .race-course-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
        }

        .race-course-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .race-course-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .race-course-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
        }

        .race-course-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .race-course-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .race-course-management-primary.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        @media (max-width: 920px) {
          .race-course-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="race-course-management-header">
        <div>
          <div className="race-course-management-kicker">Admin dashboard</div>
          <Title level={1}>Race Course Management</Title>
        </div>

        <Space wrap>
          <Button
            className="race-course-management-link-btn"
            loading={isLoading}
            onClick={loadRaceCourses}
          >
            Refresh
          </Button>

          <Button
            className="race-course-management-primary"
            onClick={openCreateModal}
          >
            Create Race Course
          </Button>
        </Space>
      </div>

      <div className="race-course-management-card">
        <Table
          className="race-course-management-table"
          columns={columns}
          dataSource={raceCourses}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} race courses`,
          }}
          scroll={{ x: 1490 }}
        />
      </div>

      <Modal
        title={editingCourse ? "Edit Race Course" : "Create Race Course"}
        open={isCourseModalOpen}
        okText={editingCourse ? "Save" : "Create"}
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleSaveCourse}
        onCancel={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
      >
        <Form form={courseForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Truong dua Dai Duong" />
          </Form.Item>

          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: "Location is required" }]}
          >
            <Input placeholder="Binh Duong" />
          </Form.Item>

          <Form.Item
            label="Track Type"
            name="trackType"
            rules={[{ required: true, message: "Track type is required" }]}
          >
            <Select
              options={TRACK_TYPES.map((trackType) => ({
                label: trackType,
                value: trackType,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Distance"
            name="distance"
            rules={[{ required: true, message: "Distance is required" }]}
          >
            <InputNumber min={1} addonAfter="m" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Race Course Detail"
        open={Boolean(detailCourse)}
        footer={null}
        width={760}
        onCancel={() => setDetailCourse(null)}
      >
        {detailCourse && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="ID">
              <Text code>{detailCourse.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {detailCourse.name}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {detailCourse.location}
            </Descriptions.Item>
            <Descriptions.Item label="Track Type">
              <Tag color="green">{detailCourse.trackType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Distance">
              {Number(detailCourse.distance).toLocaleString("vi-VN")} m
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {detailCourse.description}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatDate(detailCourse.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </section>
  );
}

export default RaceCourseManagement;
