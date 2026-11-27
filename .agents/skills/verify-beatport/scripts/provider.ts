// Imported only by the disposable replay command. Keep Exa's callTool response shape.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const artist = {
  url: "https://www.beatport.com/artist/anotr/498574",
  title: "ANOTR Music & Downloads on Beatport",
  text: "# ANOTR\n## Top Ten Tracks\n4\nRelax My Eyes Original Mix\nANOTR, Abel Balder\n6\nIt's So Nice Extended Mix\nANOTR, 3DDY",
};
const track = {
  url: "https://www.beatport.com/track/walls-dj-tennis-remix/6765597",
  title: "Art Department - Walls (DJ Tennis Remix) [No.19 Music]",
  image: "https://geo-media.beatport.com/image_size/{w}x{h}/ef6f370c-a6f2-4b04-95b7-f04aeca0de4c.jpg",
};
let limited = true;
Client.prototype.connect = async () => {};
Client.prototype.close = async () => {};
Client.prototype.callTool = async (request) => {
  const q = String(request.arguments?.query).toLowerCase();
  let results = [];
  if (q === "rate limit" && limited) {
    limited = false;
    return { isError: true, content: [{ type: "text", text: "429 rate limit" }] };
  }
  if (q.includes("walls")) {
    results = [track, { url: "https://www.beatport.com/track/walls/6765602", title: "Art Department - Walls (Chaim Remix)" }];
  } else if (q.includes("so nice") && request.arguments?.type === "lite") {
    results = [{ url: "https://www.beatport.com/track/its-so-nice/3", title: "ANOTR, 3DDY - It's So Nice (Extended Mix)" }];
  } else if (q === "anotr") {
    results = [artist, {
      url: "https://www.beatport.com/track/relax-my-eyes/2",
      title: "ANOTR, Abel Balder - Relax My Eyes (Original Mix) [NO ART]",
    }];
  }
  return { content: [{ type: "text", text: JSON.stringify({ results }) }] };
};
