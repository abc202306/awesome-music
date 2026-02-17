"use strict";
const DEBUG = false;
class Music163PlaylistScraper {
    constructor(options) {
        var _a, _b;
        this.debug = !!(options === null || options === void 0 ? void 0 : options.debug);
        this.doc = (_a = options === null || options === void 0 ? void 0 : options.document) !== null && _a !== void 0 ? _a : document;
        this.win = (_b = options === null || options === void 0 ? void 0 : options.window) !== null && _b !== void 0 ? _b : window;
    }
    log(...args) {
        if (this.debug)
            console.log(...args);
    }
    getTextContentWithoutSoil(element) {
        var _a, _b;
        if (!element)
            return null;
        const cloned = element.cloneNode(true);
        cloned.querySelectorAll('.soil').forEach(e => e.remove());
        return (_b = (_a = cloned.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null;
    }
    getSongRelatedArtistRecords(td) {
        if (!td)
            return [];
        const artistElements = td.querySelectorAll('.text a');
        const artists = [];
        artistElements.forEach(a => {
            var _a, _b, _c;
            const href = (_a = a.getAttribute('href')) !== null && _a !== void 0 ? _a : '';
            const idPart = (_c = (_b = /=(\d+)$/.exec(href)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : '';
            const artistID = `music163-artist-${idPart}`;
            const artistName = this.getTextContentWithoutSoil(a);
            artists.push({ artistID, artistName });
        });
        return artists;
    }
    getSongRelatedAlbumRecord(td) {
        var _a, _b, _c, _d;
        if (!td)
            return null;
        const albumElement = td.querySelector('.text a');
        if (!albumElement)
            return null;
        const href = (_a = albumElement.getAttribute('href')) !== null && _a !== void 0 ? _a : '';
        const idPart = (_c = (_b = /=(\d+)$/.exec(href)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : '';
        const albumID = `music163-album-${idPart}`;
        const albumName = (_d = albumElement.getAttribute('title')) !== null && _d !== void 0 ? _d : this.getTextContentWithoutSoil(albumElement);
        return { albumID, albumName };
    }
    extractSongDetails(tr) {
        var _a, _b, _c, _d, _e, _f;
        const tdArr = Array.from(tr.querySelectorAll('td'));
        const firstTd = tdArr[0];
        const ply = firstTd === null || firstTd === void 0 ? void 0 : firstTd.querySelector('.ply');
        const dataResId = (_a = ply === null || ply === void 0 ? void 0 : ply.getAttribute('data-res-id')) !== null && _a !== void 0 ? _a : '';
        const songID = `music163-song-${dataResId}`;
        const titleEl = (_b = tdArr[1]) === null || _b === void 0 ? void 0 : _b.querySelector('.txt b');
        const subTitleEl = (_c = tdArr[1]) === null || _c === void 0 ? void 0 : _c.querySelector('.txt .s-fc8');
        const timeEl = (_d = tdArr[2]) === null || _d === void 0 ? void 0 : _d.querySelector('.u-dur');
        const songTitle = this.getTextContentWithoutSoil(titleEl);
        const songSubTitle = this.getTextContentWithoutSoil(subTitleEl);
        const songTimeLength = this.getTextContentWithoutSoil(timeEl);
        const songRelatedArtistRecords = this.getSongRelatedArtistRecords((_e = tdArr[3]) !== null && _e !== void 0 ? _e : null);
        const songRelatedAlbumRecord = this.getSongRelatedAlbumRecord((_f = tdArr[4]) !== null && _f !== void 0 ? _f : null);
        return {
            songID,
            songTitle,
            songSubTitle,
            songTimeLength,
            songRelatedArtistRecords,
            songRelatedAlbumRecord
        };
    }
    extractAllSongDetails(table) {
        const tbody = table.querySelector('tbody');
        if (!tbody)
            return [];
        const trElements = Array.from(tbody.querySelectorAll('tr'));
        return trElements.map(tr => this.extractSongDetails(tr));
    }
    getNumberPartInTail(str) {
        var _a, _b;
        return (_b = (_a = /(\d*)$/.exec(str)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : '';
    }
    getSongUrl(songID) {
        return `https://music.163.com/#/song?id=${this.getNumberPartInTail(songID)}`;
    }
    getArtistUrl(artistID) {
        return `https://music.163.com/#/artist?id=${this.getNumberPartInTail(artistID)}`;
    }
    getAlbumUrl(albumID) {
        return `https://music.163.com/#/album?id=${this.getNumberPartInTail(albumID)}`;
    }
    getArtistUrlFromDetailItem(artistDetails) {
        var _a;
        return `[${(_a = artistDetails.artistName) !== null && _a !== void 0 ? _a : ''}](<${this.getArtistUrl(artistDetails.artistID)}>)`;
    }
    getAlbumUrlFromDetailItem(albumDetails) {
        var _a;
        if (!albumDetails)
            return '';
        return `[${(_a = albumDetails.albumName) !== null && _a !== void 0 ? _a : ''}](<${this.getAlbumUrl(albumDetails.albumID)}>)`;
    }
    getPlayListData() {
        var _a;
        const url = this.win.location.href;
        const table = this.doc.querySelectorAll('table.m-table')[0];
        if (!table)
            return null;
        const songDetailsArray = this.extractAllSongDetails(table);
        const idNum = (_a = url.split('=')[1]) !== null && _a !== void 0 ? _a : '';
        const playListData = {
            url,
            id: `music163-playlist-item-${idNum}`,
            idNum,
            title: this.doc.title,
            songDetailsArray
        };
        return playListData;
    }
    toMarkdownTables(playListData) {
        let markdown = '';
        const playlisturl = `https://music.163.com/#/playlist?id=${this.getNumberPartInTail(playListData.id)}`;
        const playlisttitle = playListData.title;
        const playlisturlwithname = `[${playlisttitle}](<${playlisturl}>)`;
        let frontMatter = `---\n`;
        frontMatter += `layout: page\n`;
        frontMatter += `collection:\n  - "[[collection-music163-playlist-item|collection-music163-playlist-item]]"\n`;
        frontMatter += `title: "${playlisttitle}"\n`;
        frontMatter += `url: "${playlisturl}"\n`;
        frontMatter += `---\n`;
        markdown += frontMatter + '\n';
        markdown += `# ${playListData.id}\n\n`;
        markdown += `<img src="../../assets/music163-playlist-cover-${playListData.idNum}.jpg" width=200>\n\n`;
        markdown += playlisturlwithname + '\n\n';
        const songNoteName = `music163-playlist-song-note-${playListData.idNum}`;
        markdown += `> see-also: [${songNoteName}](../music163-playlist-song-note/${songNoteName}.md), [Home](../../index.md)\n\n`;
        markdown += `- [playlist-details](#playlist-details)\n- [song-details](#song-details)\n\n`;
        markdown += `## playlist-details\n\n`;
        markdown += `| playlist-id | playlist-title | url |\n`;
        markdown += `| --- | --- | --- |\n`;
        markdown += `| ${playListData.id} | ${playListData.title} | [${playlisturl}](<${playlisturl}>) |\n\n`;
        markdown += `## song-details\n\n`;
        markdown += `| row-id | song-id | song-title | song-subtitle | song-time-length | playlist-id | url | song-artists | song-albums |\n`;
        markdown += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
        playListData.songDetailsArray.forEach((songDetails, index) => {
            var _a, _b, _c;
            const artists = songDetails.songRelatedArtistRecords.map(d => this.getArtistUrlFromDetailItem(d)).join(', ');
            const album = this.getAlbumUrlFromDetailItem(songDetails.songRelatedAlbumRecord);
            const songUrl = this.getSongUrl(songDetails.songID);
            markdown += `| ${index + 1} | ${songDetails.songID} | ${(_a = songDetails.songTitle) !== null && _a !== void 0 ? _a : ''} | ${(_b = songDetails.songSubTitle) !== null && _b !== void 0 ? _b : ''} | ${(_c = songDetails.songTimeLength) !== null && _c !== void 0 ? _c : ''} | ${playlisturlwithname} | [${songUrl}](<${songUrl}>) | ${artists} | ${album} |\n`;
        });
        return markdown;
    }
    run() {
        const data = this.getPlayListData();
        if (!data) {
            console.error('Playlist table not found on page.');
            return;
        }
        const md = this.toMarkdownTables(data);
        console.log(md);
    }
}
// Auto-run when executed in a browser context
try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        new Music163PlaylistScraper({ debug: DEBUG }).run();
    }
}
catch (e) {
    // ignore when run in non-browser tooling
}
