export default function parseTitle(title: string) {
    return title.toLowerCase().replace(/\s+/g, "-");
}