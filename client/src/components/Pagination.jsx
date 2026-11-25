// «Показано 1–8 из 112» и кнопки страниц
export default function Pagination({ page, pageSize, total, onPage }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.ceil(total / pageSize);
  return (
    <div className="table-foot">
      <span>Показано <b>{from}–{to}</b> из <b>{total}</b></span>
      {pages > 1 && (
        <div className="pager">
          <button className="btn quiet sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Назад</button>
          <span style={{ alignSelf: 'center' }}>{page} / {pages}</span>
          <button className="btn quiet sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Вперёд ›</button>
        </div>
      )}
    </div>
  );
}
