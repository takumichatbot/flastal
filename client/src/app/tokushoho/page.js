export default function TokushohoPage() {
  return (
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="prose prose-sky mx-auto">
        <h1>特定商取引法に基づく表記</h1>
        
        <table>
          <tbody>
            <tr>
              <td>販売事業者名</td>
              <td>（あなたの氏名または事業名）</td>
            </tr>
            <tr>
              <td>運営統括責任者名</td>
              <td>（あなたの氏名）</td>
            </tr>
            <tr>
              <td>所在地</td>
              <td>〒XXX-XXXX ...</td>
            </tr>
            {/* ... 以降、必要な項目を続ける ... */}
          </tbody>
        </table>

      </div>
    </div>
  );
}