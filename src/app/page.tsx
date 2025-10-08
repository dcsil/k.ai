import { postToSocialMedia } from "./actions";

export default function Home() {
  return (
    <form action={postToSocialMedia}>
      <input type="text" name="comment" />
            <button type="submit">Post to Instagram</button>
    </form>
  );
}
