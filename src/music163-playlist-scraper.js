const DEBUG = false;

function getTextContentWithoutSoil(element) {
    if (!element) {
        return null;
    }
    const elementWithoutSoil = element.cloneNode(true);
    elementWithoutSoil.querySelectorAll('.soil').forEach(soilElement => soilElement.remove());
    return elementWithoutSoil.textContent.trim();
}

function getSongRelatedArtistRecords(td) {
    const artistElements = td.querySelectorAll('.text a');
    const artists = [];
    artistElements.forEach(artistElement => {
        const artistID = "music163-artist-" + artistElement.getAttribute('href').split('=')[1];
        const artistName = getTextContentWithoutSoil(artistElement);
        artists.push({artistID, artistName});
    });
    return artists;
}

function getSongRelatedAlbumRecord(td) {
    const albumElement = td.querySelector('.text a');
    const albumID = "music163-album-"+albumElement.getAttribute('href').split('=')[1];
    const albumName = albumElement.getAttribute('title');
    return {albumID, albumName};
}

function extractSongDetails(tr) {
    const tdArr = [...tr.querySelectorAll('td')];
    const songID = "music163-song-"+tdArr[0].querySelector('.ply').getAttribute('data-res-id');
    const songTitle = getTextContentWithoutSoil(tdArr[1].querySelector('.txt b'));
    const songSubTitle = getTextContentWithoutSoil(tdArr[1].querySelector('.txt .s-fc8'));
    const songTimeLength = getTextContentWithoutSoil(tdArr[2].querySelector('.u-dur'));
    const songRelatedArtistRecords = getSongRelatedArtistRecords(tdArr[3]);
    const songRelatedAlbumRecord = getSongRelatedAlbumRecord(tdArr[4]);

    return {
        songID,
        songTitle,
        songSubTitle,
        songTimeLength,
        songRelatedArtistRecords,
        songRelatedAlbumRecord
    };
}

function extractAllSongDetails(table) {
    const tbodyElement = table.querySelector('tbody');
    const trElements = tbodyElement.querySelectorAll('tr');
    const songDetailsArray = [];
    trElements.forEach(tr => {
        const songDetails = extractSongDetails(tr);
        songDetailsArray.push(songDetails);
    });
    return songDetailsArray;
}

function getArtistDetailsArray(songDetailsArray) {
    const artistDetailsArray = [];
    songDetailsArray.forEach(songDetails => {
        songDetails.songRelatedArtistRecords.forEach(artistRecord => {
            let artistDetails = artistDetailsArray.find(artist => artist.artistID === artistRecord.artistID);
            if (!artistDetails) {
                artistDetails = {
                    artistID: artistRecord.artistID,
                    artistName: artistRecord.artistName,
                    songIDArray: [songDetails.songID]
                };
                artistDetailsArray.push(artistDetails);
            } else {
                artistDetails.songIDArray.push(songDetails.songID);
            }
        });
    });
    return artistDetailsArray;
}

function getAlbumDetailsArray(songDetailsArray) {
    const albumDetailsArray = [];
    songDetailsArray.forEach(songDetails => {
        let albumDetails = albumDetailsArray.find(album => album.albumID === songDetails.songRelatedAlbumRecord.albumID);
        if (!albumDetails) {
            albumDetails = {
                albumID: songDetails.songRelatedAlbumRecord.albumID,
                albumName: songDetails.songRelatedAlbumRecord.albumName,
                songIDArray: [songDetails.songID]
            };
            albumDetailsArray.push(albumDetails);
        } else {
            albumDetails.songIDArray.push(songDetails.songID);
        }
    });
    return albumDetailsArray;
}

function getPlayListData() {
    const url = window.location.href;
    const mTable = document.querySelectorAll("table.m-table")[0];
    const songDetailsArray = extractAllSongDetails(mTable);
    const playListData = {
        url: url,
        id: "music163-playlist-"+url.split('=')[1],
        title: document.title,
        songDetailsArray: songDetailsArray,
        artistDetailsArray: getArtistDetailsArray(songDetailsArray),
        albumDetailsArray: getAlbumDetailsArray(songDetailsArray)
    }
    return playListData;
}

function logPlayListData(playListData) {
    console.log(playListData.url);
    console.log(playListData.id);
    console.table(playListData.songDetailsArray);
    console.table(playListData.artistDetailsArray);
    console.table(playListData.albumDetailsArray);
}

function getNumberPartInTail(str) {
	return /(\d*)$/.exec(str)?.[1];
}

function getSongUrl(songID) {
    return `https://music.163.com/#/song?id=${getNumberPartInTail(songID)}`;
}

function getArtistUrl(artistID) {
    return `https://music.163.com/#/artist?id=${getNumberPartInTail(artistID)}`;
}

function getAlbumUrl(albumID) {
    return `https://music.163.com/#/album?id=${getNumberPartInTail(albumID)}`;
}

function getArtistUrlFromDetailItem(artistDetails) {
    return `[${artistDetails.artistName}](<${getArtistUrl(artistDetails.artistID)}>)`
}

function getAlbumUrlFromDetailItem(albumDetails) {
    return `[${albumDetails.albumName}](<${getAlbumUrl(albumDetails.albumID)}>)`
}

function toMarkdownTables(playListData) {
    let markdownTables = "";

    // 1 add frontmatter

    const playlisturl = `https://music.163.com/#/playlist?id=${getNumberPartInTail(playListData.id)}`;
    const playlisttitle = playListData.title;
    const playlisturlwithname = `[${playlisttitle}](<${playlisturl}>)`;

    let frontMatter = `---\n`;
    frontMatter += `layout: page\n`
    frontMatter += `collection:\n  - "music163-playlist"\n`;
    frontMatter += `playlist-id: "${playListData.id}"\n`
    frontMatter += `playlist-title: "${playlisttitle}"\n`;
    frontMatter += `url: "${playlisturl}"\n`;
    frontMatter += `---\n`;

    markdownTables += frontMatter;

    // 2 add empty-line

    markdownTables += "\n";

    // 3 add section-h1

    // 3.1 add header-line

    markdownTables += `# ${playListData.id}\n`;

    // additional content

    markdownTables += "\n";

    markdownTables += `<img src="../../assets/${playListData.id} - cover.png" width=200>\n`;

    markdownTables += "\n";

    markdownTables += playlisturlwithname+"\n";

    markdownTables += "\n";

    markdownTables += `> see-also: [${playListData.id}-song-note.md](../music163-playlist-song-note/${playListData.id}-song-note), [README.md](../../)\n`;

    // 3.2 add empty-line

    markdownTables += "\n";

    // attitional table of contents;
    markdownTables += `- [playlist-details](#playlist-details)
- [song-details](#song-details)
- [artist-details](#artist-details)
- [album-details](#album-details)
- [song-artist-mapping](#song-artist-mapping)
- [song-album-mapping](#song-album-mapping)

`

    // 3.3 add playlist-details

    let playlistDetails = `## playlist-details\n`;
    playlistDetails += "\n";
    playlistDetails += `| playlist-id | playlist-title | url |\n`
    playlistDetails += `| --- | --- | --- |\n`;
    playlistDetails += `| ${playListData.id} | ${playListData.title} | [${playlisturl}](<${playlisturl}>) |\n`
    
    markdownTables += playlistDetails;

    // 3.4 add empty-line

    markdownTables += "\n";
    
    // 3.5 add song-details

    let songDetailsStr = `## song-details\n`;
    songDetailsStr += "\n";
    songDetailsStr += `| row-id | song-id | song-title | song-subtitle | song-time-length | playlist-id | url | song-artists | song-albums |\n`;
    songDetailsStr += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.forEach((songDetails, index) => {
        songDetailsStr += `| ${index + 1} | ${songDetails.songID} | ${songDetails.songTitle} | ${songDetails.songSubTitle} | ${songDetails.songTimeLength} | ${playlisturlwithname} | [${getSongUrl(songDetails.songID)}](<${getSongUrl(songDetails.songID)}>) | ${songDetails.songRelatedArtistRecords.map(d=>getArtistUrlFromDetailItem(d)).join(", ")} | ${getAlbumUrlFromDetailItem(songDetails.songRelatedAlbumRecord)} |\n`;
    });

    markdownTables += songDetailsStr;

    // 3.6 add empty-line

    markdownTables += "\n";
    
    // 3.7 add artist-details

    let artistDetailsStr = `## artist-details\n\n`;
    artistDetailsStr += `| artist-id | artist-name | url |\n`;
    artistDetailsStr += `| --- | --- | --- |\n`;
    playListData.artistDetailsArray.forEach(artistDetails => {
        artistDetailsStr += `| ${artistDetails.artistID} | ${artistDetails.artistName} | [${getArtistUrl(artistDetails.artistID)}](<${getArtistUrl(artistDetails.artistID)}>) |\n`;
    });

    markdownTables += artistDetailsStr;
    
    // 3.8 add empty-line

    markdownTables += "\n";
    
    // 3.9 add album-details

    let albumDetailsStr = `## album-details\n\n`;
    albumDetailsStr += `| album-id | album-name | url |\n`;
    albumDetailsStr += `| --- | --- | --- |\n`;
    playListData.albumDetailsArray.forEach(albumDetails => {
        albumDetailsStr += `| ${albumDetails.albumID} | ${albumDetails.albumName} | [${getAlbumUrl(albumDetails.albumID)}](<${getAlbumUrl(albumDetails.albumID)}>) |\n`;
    });

    markdownTables += albumDetailsStr;
    
    // 3.10 add empty-line

    markdownTables += "\n";
    
    // 3.11 add song-artist-mapping

    let songArtistMapping = `## song-artist-mapping\n\n`;
    songArtistMapping += `| song-id | artist-id | song-title | artist-name |\n`;
    songArtistMapping += `| --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.flatMap(songDetails => {
        songDetails.songRelatedArtistRecords.forEach(artistRecord => {
            songArtistMapping += `| ${songDetails.songID} | ${artistRecord.artistID} | ${songDetails.songTitle} | ${artistRecord.artistName} |\n`;
        });
    });

    markdownTables += songArtistMapping;
    
    // 3.12 add empty-line

    markdownTables += "\n";
    
    // 3.13 add song-album-mapping

    let songAlbumMapping = `## song-album-mapping\n\n`;
    songAlbumMapping += `| song-id | album-id | song-title | album-name |\n`;
    songAlbumMapping += `| --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.forEach(songDetails => {
        songAlbumMapping += `| ${songDetails.songID} | ${songDetails.songRelatedAlbumRecord.albumID} | ${songDetails.songTitle} | ${songDetails.songRelatedAlbumRecord.albumName} |\n`;
    });

    markdownTables += songAlbumMapping;

    return markdownTables;
}

function main() {
    const playListData = getPlayListData();
    if (DEBUG) {
        logPlayListData(playListData);
    }
    const markdownTables = toMarkdownTables(playListData);
    console.log(markdownTables);
}

main();