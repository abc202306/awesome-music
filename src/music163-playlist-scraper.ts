const DEBUG = false;

interface ArtistRecord {
    artistID: string;
    artistName: string | null;
}

interface AlbumRecord {
    albumID: string;
    albumName: string | null;
}

interface SongDetails {
    songID: string;
    songTitle: string | null;
    songSubTitle: string | null;
    songTimeLength: string | null;
    songRelatedArtistRecords: ArtistRecord[];
    songRelatedAlbumRecord: AlbumRecord | null;
}

interface PlaylistData {
    url: string;
    id: string;
    idNum: string;
    title: string;
    songDetailsArray: SongDetails[];
}

class Music163PlaylistScraper {
    private readonly debug: boolean;
    private readonly doc: Document;
    private readonly win: Window;

    constructor(options?: { debug?: boolean; document?: Document; window?: Window }) {
        this.debug = !!options?.debug;
        this.doc = options?.document ?? document;
        this.win = options?.window ?? window;
    }

    private log(...args: unknown[]) {
        if (this.debug) console.log(...args);
    }

    private getTextContentWithoutSoil(element: Element | null): string | null {
        if (!element) return null;
        const cloned = element.cloneNode(true) as Element;
        cloned.querySelectorAll('.soil').forEach(e => e.remove());
        return cloned.textContent?.trim() ?? null;
    }

    private getSongRelatedArtistRecords(td: Element | null): ArtistRecord[] {
        if (!td) return [];
        const artistElements = td.querySelectorAll('.text a');
        const artists: ArtistRecord[] = [];
        artistElements.forEach(a => {
            const href = a.getAttribute('href') ?? '';
            const idPart = /=(\d+)$/.exec(href)?.[1] ?? '';
            const artistID = `music163-artist-${idPart}`;
            const artistName = this.getTextContentWithoutSoil(a);
            artists.push({ artistID, artistName });
        });
        return artists;
    }

    private getSongRelatedAlbumRecord(td: Element | null): AlbumRecord | null {
        if (!td) return null;
        const albumElement = td.querySelector('.text a');
        if (!albumElement) return null;
        const href = albumElement.getAttribute('href') ?? '';
        const idPart = /=(\d+)$/.exec(href)?.[1] ?? '';
        const albumID = `music163-album-${idPart}`;
        const albumName = albumElement.getAttribute('title') ?? this.getTextContentWithoutSoil(albumElement);
        return { albumID, albumName };
    }

    private extractSongDetails(tr: HTMLTableRowElement): SongDetails {
        const tdArr = Array.from(tr.querySelectorAll('td'));
        const firstTd = tdArr[0];
        const ply = firstTd?.querySelector('.ply') as HTMLElement | null;
        const dataResId = ply?.getAttribute('data-res-id') ?? '';
        const songID = `music163-song-${dataResId}`;

        const titleEl = tdArr[1]?.querySelector('.txt b') as Element | null;
        const subTitleEl = tdArr[1]?.querySelector('.txt .s-fc8') as Element | null;
        const timeEl = tdArr[2]?.querySelector('.u-dur') as Element | null;

        const songTitle = this.getTextContentWithoutSoil(titleEl);
        const songSubTitle = this.getTextContentWithoutSoil(subTitleEl);
        const songTimeLength = this.getTextContentWithoutSoil(timeEl);

        const songRelatedArtistRecords = this.getSongRelatedArtistRecords(tdArr[3] ?? null);
        const songRelatedAlbumRecord = this.getSongRelatedAlbumRecord(tdArr[4] ?? null);

        return {
            songID,
            songTitle,
            songSubTitle,
            songTimeLength,
            songRelatedArtistRecords,
            songRelatedAlbumRecord
        };
    }

    private extractAllSongDetails(table: HTMLTableElement): SongDetails[] {
        const tbody = table.querySelector('tbody');
        if (!tbody) return [];
        const trElements = Array.from(tbody.querySelectorAll('tr')) as HTMLTableRowElement[];
        return trElements.map(tr => this.extractSongDetails(tr));
    }

    private getNumberPartInTail(str: string): string {
        return /(\d*)$/.exec(str)?.[1] ?? '';
    }

    private getSongUrl(songID: string): string {
        return `https://music.163.com/#/song?id=${this.getNumberPartInTail(songID)}`;
    }

    private getArtistUrl(artistID: string): string {
        return `https://music.163.com/#/artist?id=${this.getNumberPartInTail(artistID)}`;
    }

    private getAlbumUrl(albumID: string): string {
        return `https://music.163.com/#/album?id=${this.getNumberPartInTail(albumID)}`;
    }

    private getArtistUrlFromDetailItem(artistDetails: ArtistRecord): string {
        return `[${artistDetails.artistName ?? ''}](<${this.getArtistUrl(artistDetails.artistID)}>)`;
    }

    private getAlbumUrlFromDetailItem(albumDetails: AlbumRecord | null): string {
        if (!albumDetails) return '';
        return `[${albumDetails.albumName ?? ''}](<${this.getAlbumUrl(albumDetails.albumID)}>)`;
    }

    public getPlayListData(): PlaylistData | null {
        const url = this.win.location.href;
        const table = this.doc.querySelectorAll('table.m-table')[0] as HTMLTableElement | undefined;
        if (!table) return null;
        const songDetailsArray = this.extractAllSongDetails(table);
        const idNum = url.split('=')[1] ?? '';
        const playListData: PlaylistData = {
            url,
            id: `music163-playlist-item-${idNum}`,
            idNum,
            title: this.doc.title,
            songDetailsArray
        };
        return playListData;
    }

    public toMarkdownTables(playListData: PlaylistData): string {
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
        markdown += `<img src="../assets/music163-playlist-cover-${playListData.idNum}.jpg" width=200>\n\n`;
        markdown += playlisturlwithname + '\n\n';

        const songNoteName = `music163-playlist-song-note-${playListData.idNum}.md`;
        markdown += `> see-also: [${songNoteName}](../music163-playlist-song-note/${songNoteName}), [Home](../index.md)\n\n`;

        markdown += `- [playlist-details](#playlist-details)\n- [song-details](#song-details)\n\n`;

        markdown += `## [[playlist-details]]\n\n`;
        markdown += `| playlist-id | playlist-title | url |\n`;
        markdown += `| --- | --- | --- |\n`;
        markdown += `| ${playListData.id} | ${playListData.title} | [${playlisturl}](<${playlisturl}>) |\n\n`;

        markdown += `## [[song-details]]\n\n`;
        markdown += `| row-id | song-id | song-title | song-subtitle | song-time-length | playlist-id | url | song-artists | song-albums |\n`;
        markdown += `| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;

        playListData.songDetailsArray.forEach((songDetails, index) => {
            const artists = songDetails.songRelatedArtistRecords.map(d => this.getArtistUrlFromDetailItem(d)).join(', ');
            const album = this.getAlbumUrlFromDetailItem(songDetails.songRelatedAlbumRecord);
            const songUrl = this.getSongUrl(songDetails.songID);
            markdown += `| ${index + 1} | ${songDetails.songID} | ${songDetails.songTitle ?? ''} | ${songDetails.songSubTitle ?? ''} | ${songDetails.songTimeLength ?? ''} | ${playlisturlwithname} | [${songUrl}](<${songUrl}>) | ${artists} | ${album} |\n`;
        });

        return markdown;
    }

    public run(): void {
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
} catch (e) {
    // ignore when run in non-browser tooling
}