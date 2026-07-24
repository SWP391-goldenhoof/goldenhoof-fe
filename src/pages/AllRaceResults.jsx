import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getFinishedRaceResults } from "../api/services/home.service";
import Pagination from "../components/ui/Pagination";
import "./ExploreLists.css";

dayjs.extend(utc);

const PAGE_SIZE = 6;

function formatRaceDateTime(value, fallback = "-") {
  if (!value) return fallback;
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : fallback;
}

function getDateSortValue(value) {
  const date = dayjs(value);
  return date.isValid() ? date.valueOf() : 0;
}

export default function AllRaceResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [surface, setSurface] = useState("all");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    getFinishedRaceResults()
      .then((data) => mounted && setResults(data || []))
      .catch(() => mounted && setResults([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const surfaces = useMemo(
    () => [...new Set(results.map((result) => result.surface).filter(Boolean))],
    [results],
  );
  const visibleResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return results
      .filter(
        (result) =>
          (!query ||
            result.race.toLowerCase().includes(query) ||
            result.tournament.toLowerCase().includes(query) ||
            result.winner.toLowerCase().includes(query) ||
            result.venue.toLowerCase().includes(query)) &&
          (surface === "all" || result.surface === surface),
      )
      .sort((first, second) => {
        if (sort === "date-asc") {
          return getDateSortValue(first.date) - getDateSortValue(second.date);
        }
        if (sort === "name-asc") return first.race.localeCompare(second.race);
        if (sort === "name-desc") return second.race.localeCompare(first.race);
        return getDateSortValue(second.date) - getDateSortValue(first.date);
      });
  }, [results, search, sort, surface]);
  const paginatedResults = visibleResults.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, sort, surface]);

  useEffect(() => {
    if (!selectedResult) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedResult]);

  const selectedRankings = selectedResult?.results?.length
    ? [...selectedResult.results].sort(
        (first, second) =>
          Number(first.finalRank ?? first.rawRank ?? first.rank ?? 999) -
          Number(second.finalRank ?? second.rawRank ?? second.rank ?? 999),
      )
    : [];

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <header className="explore-header">
          <div>
            <span className="explore-eyebrow">GOLDEN HOOF</span>
            <h1>All Race Results</h1>
          </div>
          <span className="explore-count">{visibleResults.length} kết quả</span>
        </header>
        <div className="explore-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm race, tournament, địa điểm hoặc người thắng…"
          />
          <select value={surface} onChange={(event) => setSurface(event.target.value)}>
            <option value="all">Tất cả mặt đường</option>
            {surfaces.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="date-desc">Ngày đua mới nhất</option>
            <option value="date-asc">Ngày đua cũ nhất</option>
            <option value="name-asc">Tên race A → Z</option>
            <option value="name-desc">Tên race Z → A</option>
          </select>
          <Link className="explore-back explore-toolbar-home" to="/home">← Về Home</Link>
        </div>
        {loading ? (
          <div className="explore-state">Đang tải kết quả race…</div>
        ) : visibleResults.length ? (
          <section className="result-records">
            {paginatedResults.map((result) => (
              <article className="result-record" key={result.id}>
                <img src={result.image} alt="" />
                <div className="result-record-main">
                  <strong>{result.tournament}</strong>
                  <small>{result.race}</small>
                </div>
                <div><span>Date</span><strong>{formatRaceDateTime(result.date)}</strong></div>
                <div><span>Winner</span><strong>{result.winner}</strong></div>
                <div><span>Jockey</span><strong>{result.jockey}</strong></div>
                <div className="result-record-actions">
                  <button type="button" onClick={() => setSelectedResult(result)}>
                    Detail
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : <div className="explore-state">Không tìm thấy kết quả phù hợp.</div>}
        <Pagination
          page={page}
          totalItems={visibleResults.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
      {selectedResult && (
        <div
          className="race-result-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedResult(null)}
        >
          <section
            className="race-result-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="race-result-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="race-result-modal-header">
              <div>
                <span className="explore-eyebrow">Race detail</span>
                <h2 id="race-result-detail-title">{selectedResult.race}</h2>
                <p>{selectedResult.tournament}</p>
              </div>
              <button type="button" onClick={() => setSelectedResult(null)}>
                Close
              </button>
            </div>

            <div className="race-result-detail-grid">
              <div><span>Status</span><strong>{selectedResult.status}</strong></div>
              <div><span>Date</span><strong>{formatRaceDateTime(selectedResult.date)}</strong></div>
              <div><span>Race Course</span><strong>{selectedResult.venue}</strong></div>
              <div><span>Distance</span><strong>{selectedResult.distance} · {selectedResult.trackType}</strong></div>
            </div>

            {selectedRankings.length ? (
              <div className="race-result-ranking">
                <div className="race-result-ranking-head">
                  <span>Rank</span>
                  <span>Horse</span>
                  <span>Jockey</span>
                  <span>Finished time</span>
                  <span>Status</span>
                </div>
                {selectedRankings.map((item) => (
                  <div className="race-result-ranking-row" key={item.resultId || `${item.horseId}-${item.finalRank}`}>
                    <strong>#{item.finalRank ?? item.rawRank ?? "-"}</strong>
                    <span>{item.horseName || item.horseId || "-"}</span>
                    <span>{item.jockeyName || item.jockeyId || "-"}</span>
                    <span>{formatRaceDateTime(item.finishedTime)}</span>
                    <span>{item.status || "-"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="explore-state race-result-empty">
                Chưa có kết quả chi tiết cho race này.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
