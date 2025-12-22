
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
    const mTable = document.querySelectorAll("table.m-table")[0];
    const playListData = {
        id: "music163-playlist-"+window.location.href.split('=')[1],
        title: document.title,
        songDetailsArray: extractAllSongDetails(mTable),
        artistDetailsArray: getArtistDetails(extractAllSongDetails(mTable)),
        albumDetailsArray: getAlbumDetails(extractAllSongDetails(mTable))
    }
    return playListData;
}

function logPlayListData(playListData) {
    console.log(playListData.id);
    console.table(playListData.songDetailsArray);
    console.table(playListData.artistDetailsArray);
    console.table(playListData.albumDetailsArray);
}

function getNumberPartInEnd(str) {
	return /(\d*)$/.exec(str)?.[1];
}

function toMarkdownTables(playListData) {
    let markdownTables = `# ${playListData.id}\n\n`;
    markdownTables += `## playlist-details\n\n`;
    markdownTables += `| playlist-id | playlist-title | url |\n`
    markdownTables += `| --- | --- | --- |\n`;
    markdownTables += `| ${playListData.id} | ${playListData.title} | [https://music.163.com/#/playlist?id=${playListData.id}](<https://music.163.com/#/playlist?id=${playListData.id}>) |\n`
    markdownTables += `\n## song-details\n\n`;
    markdownTables += `| row-id | song-id | song-title | song-subtitle | song-time-length | playlist-id | url |\n`;
    markdownTables += `| --- | --- | --- | --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.forEach((songDetails, index) => {
        markdownTables += `| ${index + 1} | ${songDetails.songID} | ${songDetails.songTitle} | ${songDetails.songSubTitle} | ${songDetails.songTimeLength} | ${playListData.id} | [https://music.163.com/#/song?id=${getNumberPartInEnd(songDetails.songID)}](<https://music.163.com/#/song?id=${getNumberPartInEnd(songDetails.songID)}>) |\n`;
    });

    markdownTables += `\n## artist-details\n\n`;
    markdownTables += `| artist-id | artist-name | url |\n`;
    markdownTables += `| --- | --- | --- |\n`;
    playListData.artistDetailsArray.forEach(artistDetails => {
        markdownTables += `| ${artistDetails.artistID} | ${artistDetails.artistName} | [https://music.163.com/#/artist?id=${getNumberPartInEnd(artistDetails.artistID)}](<https://music.163.com/#/artist?id=${getNumberPartInEnd(artistDetails.artistID)}>) |\n`;
    });

    markdownTables += `\n## album-details\n\n`;
    markdownTables += `| album-id | album-name | url |\n`;
    markdownTables += `| --- | --- | --- |\n`;
    playListData.albumDetailsArray.forEach(albumDetails => {
        markdownTables += `| ${albumDetails.albumID} | ${albumDetails.albumName} | [https://music.163.com/#/album?id=${getNumberPartInEnd(albumDetails.albumID)}](<https://music.163.com/#/album?id=${getNumberPartInEnd(albumDetails.albumID)}>) |\n`;
    });

    markdownTables += `\n## song-artist-mapping\n\n`;
    markdownTables += `| song-id | artist-id | song-title | artist-name |\n`;
    markdownTables += `| --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.flatMap(songDetails => {
        songDetails.songRelatedArtistRecords.forEach(artistRecord => {
            markdownTables += `| ${songDetails.songID} | ${artistRecord.artistID} | ${songDetails.songTitle} | ${artistRecord.artistName} |\n`;
        });
    });

    markdownTables += `\n## song-album-mapping\n\n`;
    markdownTables += `| song-id | album-id | song-title | album-name |\n`;
    markdownTables += `| --- | --- | --- | --- |\n`;
    playListData.songDetailsArray.forEach(songDetails => {
        markdownTables += `| ${songDetails.songID} | ${songDetails.songRelatedAlbumRecord.albumID} | ${songDetails.songTitle} | ${songDetails.songRelatedAlbumRecord.albumName} |\n`;
    });

    return markdownTables;
}

function main() {
    const playListData = getPlayListData();
    logPlayListData(playListData);
    const markdownTables = toMarkdownTables(playListData);
    console.log(markdownTables);
}

main();