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

function getArtistDetails(songDetailsArray) {
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

function getAlbumDetails(songDetailsArray) {
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
        artistDetailsArray: getArtistDetails(songDetailsArray),
        albumDetailsArray: getAlbumDetails(songDetailsArray)
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

function toMarkdownTables(playListData) {
    let markdownTables = "";

    // 1 add frontmatter

    let frontMatter = `---\n`;
    frontMatter += `collection:\n  - "music163-playlist"\n`;
    frontMatter += `playlist-id: "${playListData.id}"\n`;
    frontMatter += `playlist-title: "${playListData.title}"\n`;
    frontMatter += `url: "https://music.163.com/#/playlist?id=${playListData.id}"\n`;
    frontMatter += `---\n`;

    markdownTables += frontMatter;

    // 2 add empty-line

    markdownTables += "\n";

    // 3 add section-h1

    // 3.1 add header-line

    markdownTables += `# ${playListData.id}\n`;

    // additional content

    markdownTables += "\n";

    markdownTables += "> see-also: [${playListData.id}-song-note.md](../music163-playlist-song-note/${playListData.id}-song-note), [README.md](../../README)\n";

    // 3.2 add empty-line

    markdownTables += "\n";

    // 3.3 add playlist-details

    let playlistDetails = `## playlist-details\n`;
    playlistDetails += "\n";
    playlistDetails += `| playlist-id | playlist-title | url |\n`
    playlistDetails += `| --- | --- | --- |\n`;
    playlistDetails += `| ${playListData.id} | ${playListData.title} | [https://music.163.com/#/playlist?id=${playListData.id}](<https://music.163.com/#/playlist?id=${playListData.id}>) |\n`
    
    markdownTables += playlistDetails;

    // 3.4 add empty-line

    markdownTables += "\n";
    
    // 3.5 add song-details

    let songDetails = `## song-details\n`;
    songDetails += "\n";
    songDetails += `| row-id | song-id | song-title | song-subtitle | song-time-length | playlist-id | url |\n`;
    songDetails += `| --- | --- | --- | --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.forEach((songDetails, index) => {
        songDetails += `| ${index + 1} | ${songDetails.songID} | ${songDetails.songTitle} | ${songDetails.songSubTitle} | ${songDetails.songTimeLength} | ${playListData.id} | [https://music.163.com/#/song?id=${getNumberPartInTail(songDetails.songID)}](<https://music.163.com/#/song?id=${getNumberPartInTail(songDetails.songID)}>) |\n`;
    });

    markdownTables += songDetails;

    // 3.6 add empty-line

    markdownTables += "\n";
    
    // 3.7 add artist-details

    let artistDetails = `## artist-details\n\n`;
    artistDetails += `| artist-id | artist-name | url |\n`;
    artistDetails += `| --- | --- | --- |\n`;
    playListData.artistDetailsArray.forEach(artistDetails => {
        artistDetails += `| ${artistDetails.artistID} | ${artistDetails.artistName} | [https://music.163.com/#/artist?id=${getNumberPartInTail(artistDetails.artistID)}](<https://music.163.com/#/artist?id=${getNumberPartInTail(artistDetails.artistID)}>) |\n`;
    });

    markdownTables += artistDetails;
    
    // 3.8 add empty-line

    markdownTables += "\n";
    
    // 3.9 add album-details

    let albumDetails = `## album-details\n\n`;
    albumDetails += `| album-id | album-name | url |\n`;
    albumDetails += `| --- | --- | --- |\n`;
    playListData.albumDetailsArray.forEach(albumDetails => {
        albumDetails += `| ${albumDetails.albumID} | ${albumDetails.albumName} | [https://music.163.com/#/album?id=${getNumberPartInTail(albumDetails.albumID)}](<https://music.163.com/#/album?id=${getNumberPartInTail(albumDetails.albumID)}>) |\n`;
    });

    markdownTables += albumDetails;
    
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

    let songAlbumMapping = `\n## song-album-mapping\n\n`;
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