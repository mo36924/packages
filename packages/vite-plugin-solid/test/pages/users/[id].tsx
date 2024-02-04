import { createSignal } from "solid-js";

export default () => {
  const [count, setCount] = createSignal(0);
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>
        <div>index</div>
        <div>
          <button
            onclick={() => {
              setCount(count() + 1);
            }}
          >
            {count()}
          </button>
        </div>
        <ul>
          <li>
            <a href="/">index</a>
          </li>
          <li>
            <a href="/index1">index1</a>
          </li>
          <li>
            <a href="/users/1">user1</a>
          </li>
        </ul>
      </body>
    </html>
  );
};
