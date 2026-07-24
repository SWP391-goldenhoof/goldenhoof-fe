import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
    Card,
    Input,
    Space,
    Table,
    Tag,
    Typography,
    message,
    Modal,
    Descriptions,
    List,
    Button,
    Spin,
    Avatar,
    Row,
    Col,
    Select,
} from "antd";

import {
    getTournaments,
} from "../../api/services/tournament.service";

import {
    getRacesByTournament,
    getRaceById,
} from "../../api/services/race.service";
import { getRaceCourseById } from "../../api/services/race-course.service";
import { getHorseById } from "../../api/services/horse.service";
import { getUserById } from "../../api/services/user.service";

import "./RefereeTournamentList.css";

dayjs.extend(utc);

const { Text } = Typography;

export default function RefereeTournamentList() {
    const [loading, setLoading] =
        useState(false);

    const [tournaments, setTournaments] =
        useState([]);

    const [searchText, setSearchText] =
        useState("");

    const [raceCourseName, setRaceCourseName] =
        useState("");

    const [raceParticipants, setRaceParticipants] =
        useState([]);

    const [statusFilter, setStatusFilter] =
        useState("");

    const [tournamentLoading, setTournamentLoading] =
        useState(false);

    // Tournament modal
    const [
        selectedTournament,
        setSelectedTournament,
    ] = useState(null);

    const [
        tournamentModalOpen,
        setTournamentModalOpen,
    ] = useState(false);

    // Race modal
    const [selectedRace, setSelectedRace] =
        useState(null);

    const [raceModalOpen, setRaceModalOpen] =
        useState(false);

    const [raceLoading, setRaceLoading] =
        useState(false);

    useEffect(() => {
        loadTournaments(statusFilter);
    }, [statusFilter]);

    async function handleViewTournament(tournament) {
        try {
            setTournamentLoading(true);

            const races =
                await getRacesByTournament(tournament._id);

            setSelectedTournament({
                ...tournament,
                races,
            });

            setTournamentModalOpen(true);
        } catch (error) {
            console.error(error);
            message.error("Failed to load races");
        } finally {
            setTournamentLoading(false);
        }
    }

    async function loadTournaments(status = "") {
        setLoading(true);

        try {
            const response = await getTournaments(
                status ? { status } : {}
            );

            const tournamentList = Array.isArray(response)
                ? response
                : response?.data || [];

            setTournaments(tournamentList);
        } catch (error) {
            console.error(error);
            message.error("Failed to load tournaments");
        } finally {
            setLoading(false);
        }
    }

    async function handleViewRace(raceId) {
        try {
            setRaceLoading(true);

            const race = await getRaceById(raceId);

            // Load Race Course
            let courseName = "-";

            if (race?.raceCourseId) {
                try {
                    const course =
                        await getRaceCourseById(
                            race.raceCourseId
                        );

                    courseName =
                        course?.name ||
                        course?.data?.name ||
                        "-";
                } catch (error) {
                    console.error(error);
                }
            }

            setRaceCourseName(courseName);

            // Load Participants
            const participants =
                race?.participants || [];

            const participantDetails =
                await Promise.all(
                    participants.map(
                        async (participant) => {
                            let horseName = "-";
                            let horseImage = "";
                            let jockeyName = "-";

                            try {
                                const horse =
                                    await getHorseById(
                                        participant.horseId
                                    );

                                horseName =
                                    horse?.name || "-";

                                horseImage =
                                    horse?.imageUrl ||
                                    "";
                            } catch (error) {
                                console.error(
                                    error
                                );
                            }

                            try {
                                const jockey =
                                    await getUserById(
                                        participant.jockeyId
                                    );

                                jockeyName =
                                    jockey?.fullName ||
                                    "-";
                            } catch (error) {
                                console.error(
                                    error
                                );
                            }

                            return {
                                gateNumber:
                                    participant.gateNumber,
                                horseName,
                                horseImage,
                                jockeyName,
                            };
                        }
                    )
                );

            setRaceParticipants(
                participantDetails
            );

            setSelectedRace(race);

            setRaceModalOpen(true);
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load race detail"
            );
        } finally {
            setRaceLoading(false);
        }
    }

    const statusColor = {
        Preparing: "gold",
        Registration: "cyan",
        Upcoming: "blue",
        Ongoing: "green",
        Completed: "purple",
        Canceled: "red"
    }

    const filteredData = useMemo(() => {
        return tournaments.filter((item) =>
            (item?.title || "")
                .toLowerCase()
                .includes(
                    searchText.toLowerCase()
                )
        );
    }, [tournaments, searchText]);

    const columns = [
        {
            title: "Tournament",
            dataIndex: "title",
            key: "title",
            render: (value) => (
                <Text
                    strong
                    className="dashboard-table-title"
                >
                    {value || "N/A"}
                </Text>
            ),
        },

        {
            title: "Time",
            key: "time",
            render: (_, record) => (
                <div>
                    <div>
                        Start: {record.startDate || "-"}
                    </div>

                    <div>
                        End: {record.endDate || "-"}
                    </div>
                </div>
            ),
        },

        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    style={{
                        background: "#0b6e4f",
                        color: "#fff",
                        border: "none"
                    }}
                >
                    {status ||
                        "Unknown"}
                </Tag>
            ),
        },

        {
            title: "Race Course",
            dataIndex: "location",
            key: "location",
            render: (value) =>
                value || "-",
        },

        {
            title: "Round",
            dataIndex: "totalRounds",
            key: "totalRounds",
            render: (value) =>
                value || "-",
        },

        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Button
                    className="dashboard-table-btn"
                    onClick={() => handleViewTournament(record)}
                >
                    View Detail
                </Button>
            ),
        },
    ];

    return (
        <>
            <div className="referee-dashboard-page">
                <Space
                    direction="vertical"
                    size={28}
                    style={{
                        width: "100%",
                    }}
                >

                    <Card
                        className="dashboard-hero"
                    >
                        <Row
                            align="middle"
                            justify="space-between"
                            gutter={[24, 24]}
                        >
                            <Col
                                xs={24}
                                sm={24}
                                md={16}
                                lg={16}
                            >
                                <div className="dashboard-badge">
                                    GOLDEN HOOF RACING SYSTEM
                                </div>

                                <Typography.Title
                                    level={1}
                                    className="dashboard-title"
                                >
                                    Tournament
                                    <span className="dashboard-title-highlight">
                                        {" "}
                                        Explorer
                                    </span>
                                </Typography.Title>

                                <Typography.Paragraph
                                    className="dashboard-subtitle"
                                >
                                    Browse tournaments,
                                    inspect races,
                                    review participants,
                                    and monitor every competition.
                                </Typography.Paragraph>
                            </Col>

                            <Col
                                xs={24}
                                sm={24}
                                md={8}
                                lg={8}
                            >
                                <img
                                    src="/goldenhoof-hero.png"
                                    alt="Tournament Hero"
                                    className="dashboard-hero-image"
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        className="dashboard-content-card"
                        title={
                            <span className="dashboard-card-title">
                                Tournament List
                            </span>
                        }

                        extra={
                            <Space>

                                <Tag className="dashboard-total-tag">
                                    {filteredData.length} tournaments
                                </Tag>

                            </Space>
                        }

                        extra={
                            <Typography.Text
                                className="dashboard-card-extra"
                            >
                                Browse all tournaments
                            </Typography.Text>
                        }
                    >
                        <Space
                            direction="vertical"
                            style={{
                                width: "100%",
                            }}
                        >
                            <Space
                                direction="vertical"
                                size={16}
                                style={{
                                    width: "100%",
                                    marginBottom: 16
                                }}
                            >
                                <div className="dashboard-filter-bar">
                                    <Input.Search
                                        size="large"
                                        style={{
                                            width: "100%"
                                        }}
                                        placeholder="Search tournament"
                                        allowClear
                                        onChange={(e) =>
                                            setSearchText(e.target.value)
                                        }
                                    />

                                    <Select
                                        size="large"
                                        style={{
                                            width: "100%"
                                        }}
                                        placeholder="Filter status"
                                        allowClear
                                        value={statusFilter || undefined}
                                        onChange={(value) =>
                                            setStatusFilter(value || "")
                                        }
                                        options={[
                                            {
                                                value: "Preparing",
                                                label: "Preparing",
                                            },
                                            {
                                                value: "Registration",
                                                label: "Registration",
                                            },
                                            {
                                                value: "Upcoming",
                                                label: "Upcoming",
                                            },
                                            {
                                                value: "Ongoing",
                                                label: "Ongoing",
                                            },
                                            {
                                                value: "Completed",
                                                label: "Completed",
                                            },
                                            {
                                                value: "Canceled",
                                                label: "Canceled",
                                            },
                                        ]}
                                    />
                                </div>
                            </Space>

                            <div className="table-responsive">
                                <Table
                                    scroll={{ x: 1000 }}
                                    className="dashboard-table"
                                    size="large"
                                    rowKey="_id"
                                    loading={loading}
                                    columns={columns}
                                    dataSource={filteredData}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                    }}
                                />
                            </div>
                        </Space>
                    </Card>
                </Space>
            </div>

            {/* Tournament Modal */}

            <Modal
                className="dashboard-modal"
                open={
                    tournamentModalOpen
                }
                onCancel={() =>
                    setTournamentModalOpen(
                        false
                    )
                }
                footer={null}
                width={900}
                style={{
                    maxWidth: "95vw"
                }}
                title={
                    <div>
                        <div className="dashboard-modal-title">
                            {selectedTournament?.title}
                        </div>

                        <div className="dashboard-modal-subtitle">
                            Tournament information and race overview
                        </div>
                    </div>
                }

            >
                {selectedTournament && (
                    <>
                        <Descriptions
                            bordered
                            style={{
                                marginBottom: 32
                            }}
                            column={1}
                        >
                            <Descriptions.Item label="Status">
                                {
                                    selectedTournament.status
                                }
                            </Descriptions.Item>

                            <Descriptions.Item label="Location">
                                {
                                    selectedTournament.location
                                }
                            </Descriptions.Item>

                            <Descriptions.Item label="Start Date">
                                {selectedTournament.startDate || "-"}
                            </Descriptions.Item>

                            <Descriptions.Item label="End Date">
                                {selectedTournament.endDate || "-"}
                            </Descriptions.Item>
                        </Descriptions>

                        <div className="dashboard-divider" />
                        {tournamentLoading ? (
                            <Spin />
                        ) : (
                            <List
                                header={
                                    <Typography.Title
                                        level={5}
                                    >
                                        Race List
                                    </Typography.Title>
                                }
                                bordered
                                dataSource={
                                    selectedTournament.races ||
                                    []
                                }

                                renderItem={(
                                    race
                                ) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="view"
                                                className="dashboard-table-btn"
                                                onClick={() =>
                                                    handleViewRace(
                                                        race._id
                                                    )
                                                }
                                            >
                                                View
                                                Race
                                                Detail
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Typography.Text
                                                    className="race-title"
                                                >
                                                    {race.name}
                                                </Typography.Text>
                                            }
                                            description={
                                                <Space
                                                    direction="vertical"
                                                    size={4}
                                                >
                                                    <Tag color={statusColor[status]}>
                                                        {race.status}
                                                    </Tag>

                                                    <Text className="race-round">
                                                        Round {race.round}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </>
                )}
            </Modal>

            {/* Race Detail Modal */}

            <Modal
                className="dashboard-modal"
                open={raceModalOpen}
                onCancel={() =>
                    setRaceModalOpen(
                        false
                    )
                }
                footer={null}
                width={1100}
                style={{
                    maxWidth: "95vw"
                }}
                title={
                    <div>
                        <div className="dashboard-modal-title">
                            {selectedRace?.name || "Race Detail"}
                        </div>

                        <div className="dashboard-modal-subtitle">
                            Inspect race information and participants
                        </div>
                    </div>
                }
            >
                {raceLoading ? (
                    <Spin />
                ) : (
                    selectedRace && (
                        <>
                            <Descriptions
                                bordered
                                style={{
                                    marginBottom: 32
                                }}
                                column={2}
                            >
                                <Descriptions.Item label="Race Name">
                                    {selectedRace.name}
                                </Descriptions.Item>

                                <Descriptions.Item label="Status">
                                    {selectedRace.status}
                                </Descriptions.Item>

                                <Descriptions.Item label="Round">
                                    {selectedRace?.roundNumber ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Race Course">
                                    {raceCourseName ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Start Time">
                                    {selectedRace.startTime
                                        ? dayjs.utc(selectedRace.startTime).format("HH:mm DD/MM/YYYY")
                                        : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Date">
                                    {selectedRace.date
                                        ? dayjs.utc(selectedRace.date).format("DD/MM/YYYY")
                                        : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Race Order">
                                    {selectedRace.raceOrder ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Total Slots">
                                    {selectedRace.totalSlots ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Filled Slots">
                                    {selectedRace.filledSlots ||
                                        "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Available Slots">
                                    {selectedRace.availableSlots ||
                                        "-"}
                                </Descriptions.Item>
                            </Descriptions>

                            <div className="dashboard-divider" />

                            <div className="dashboard-section-header">

                                <Typography.Title
                                    level={4}
                                    className="dashboard-section-title"
                                >
                                    Participants
                                </Typography.Title>

                                <Tag color="cyan">
                                    {raceParticipants.length} Horses
                                </Tag>

                            </div>
                            <div className="table-responsive">
                                <Table
                                    scroll={{ x: 600 }}
                                    className="dashboard-table participant-table"
                                    size="large"
                                    rowKey={(record) =>
                                        record.gateNumber
                                    }
                                    pagination={false}
                                    dataSource={
                                        raceParticipants
                                    }
                                    columns={[
                                        {
                                            title: "Gate",
                                            dataIndex: "gateNumber",
                                            render: (gate) =>

                                                <Tag color="cyan">
                                                    Gate {gate}
                                                </Tag>
                                        },

                                        {
                                            title: "Horse",
                                            render: (
                                                _,
                                                record
                                            ) => (
                                                <Space
                                                    style={{
                                                        marginBottom: 16,
                                                    }}
                                                >
                                                    <Avatar
                                                        className="horse-avatar"
                                                        src={
                                                            record.horseImage
                                                        }
                                                        size={52}
                                                    />

                                                    <div>

                                                        <div className="dashboard-horse-name">
                                                            {record.horseName}
                                                        </div>

                                                        <div className="dashboard-horse-subtitle">
                                                            Race Horse
                                                        </div>

                                                    </div>
                                                </Space>
                                            ),
                                        },

                                        {
                                            title: "Jockey",
                                            dataIndex:
                                                "jockeyName",
                                        },
                                    ]}
                                />
                            </div>
                        </>
                    )
                )}
            </Modal>
        </>
    );
}
