# 어설픈 용맹 기록실

이 폴더의 내용만 GitHub 저장소 최상위에 올리세요. 로그 분석 작업 폴더 전체를 올릴 필요가 없습니다.

- index.html: 세션·대화 목록, 검색 및 필터
- characters.html: 캐릭터 일람
- character.html: 캐릭터별 참가·등장 기록
- read.html: 대화 읽기, 인물 링크, 본문 검색, 회차·관련 이야기 이동
- data/: 게시에 필요한 검토된 대화와 목록

현재 2439개 이야기, 276개 인물 항목을 수록합니다. 원본 전체 처리율은 100.00%입니다. 원본 전체의 분류 검토를 마쳤습니다. 같은 이름을 구분할 근거가 부족한 표시는 개별 인물에 무리하게 합치지 않습니다.

## 게시

1. 공개 GitHub 저장소를 만듭니다.
2. 이 폴더의 내용(index.html, data 폴더, .nojekyll 등)을 저장소 최상위에 올립니다.
3. Settings → Pages → Deploy from a branch → main / (root) → Save.
4. 표시되는 사이트 주소에서 검색과 링크를 확인합니다.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 갱신

분석 작업 폴더에서 node 정리도구/build-site.mjs 를 실행한 뒤 이 폴더의 변경분을 다시 올립니다. 이 명령은 현재 정리 결과로 게시 파일만 생성하며, 원본 로그 분석을 재개하지 않습니다. 새 분석 내용을 반영하려면 먼저 기존 정리 빌드를 실행합니다.

게시-ID.json은 정리도구 폴더에 유지해야 이후에도 세션 주소를 보존할 수 있습니다. 원본 로그와 정리결과는 로컬에 그대로 남습니다.

파일이 많으므로 GitHub Desktop을 사용하는 게시 순서는 [게시안내.md](게시안내.md)를 참고하세요.
