import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { getHorses } from "../api/services/horse.service";
import Pagination from "../components/ui/Pagination";
import "./ExploreLists.css";

const PAGE_SIZE = 6;

function imageUrl(value) {
  if (!value) return "/goldenhoof-hero.png";
  if (String(value).startsWith("http")) return value;
  return `${String(API_BASE_URL || "").replace(/\/$/, "")}/${String(value).replace(/^\//, "")}`;
}

function normalizeHorse(horse, index) {
  return {
    id: horse?._id || horse?.id || horse?.horseId || index,
    name: horse?.name || horse?.horseName || "Unnamed horse",
    breed: horse?.breed || "Horse",
    owner:
      horse?.ownerName ||
      horse?.owner?.fullName ||
      horse?.owner?.name ||
      horse?.stable ||
      "N/A",
    status: horse?.horseStatus || horse?.status || "Unknown",
    wins: Number(horse?.totalWin ?? horse?.wins ?? 0),
    winRate: Number(horse?.winRate ?? 0),
    image: imageUrl(
      horse?.imageUrl || horse?.avatar || horse?.avatarUrl || horse?.photoUrl,
    ),
  };
}

export default function AllHorses() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortWinRate, setSortWinRate] = useState("");
  const [sortTotalWin, setSortTotalWin] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const params = {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          sortWinRate: sortWinRate || undefined,
          sortTotalWin: sortTotalWin || undefined,
        };

        const data = await getHorses(params);

        setHorses((data || []).map(normalizeHorse));
      } catch {
        setHorses([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search,
    status,
    sortWinRate,
    sortTotalWin,]);

  const statuses = [
    "IDLE",
    "INJURED",
    "REGISTERED",
    "RACING",
    "SUSPENDED",
  ];

  const visibleHorses = horses;
  const paginatedHorses = visibleHorses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
    sortWinRate,
    sortTotalWin,
  ]);

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <Link className="explore-back" to="/home">← Back Home</Link>
        <header className="explore-header">
          <div>
            <span className="explore-eyebrow">GOLDEN HOOF</span>
            <h1>All Horses</h1>
            <p>View all horse</p>
          </div>
          <span className="explore-count">{visibleHorses.length} horses</span>
        </header>
        <div className="explore-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by horse name"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All status</option>

            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sortWinRate}
            onChange={(e) => setSortWinRate(e.target.value)}
          >
            <option value="">Win Rate</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select
            value={sortTotalWin}
            onChange={(e) => setSortTotalWin(e.target.value)}
          >
            <option value="">Total Wins</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

        </div>
        {loading ? (
          <div className="explore-state">Loading</div>
        ) : visibleHorses.length ? (
          <section className="explore-grid">
            {paginatedHorses.map((horse) => (
              <article
                className="explore-card explore-card-horizontal"
                key={horse.id}
              >
                <img
                  className="explore-round-avatar"
                  src={horse.image}
                  alt={horse.name}
                />
                <div className="explore-card-body">
                  <h2>{horse.name}</h2>
                  <span className="explore-card-subtitle">{horse.breed} · {horse.status}</span>
                  <div className="explore-card-stats">
                    <div><span>Owner</span><strong>{horse.owner}</strong></div>
                    <div><span>Wins</span><strong>{horse.wins}</strong></div>
                    <div><span>Win rate</span><strong>{horse.winRate}%</strong></div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : <div className="explore-state">No horse found</div>}
        <Pagination
          page={page}
          totalItems={visibleHorses.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
    </main>
  );
}
