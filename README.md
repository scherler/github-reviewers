# github-reviewers

When you create a pull request, you can request or delete a specific group of reviewer on the pull request. You can also see a list of reviews requested.


## Installation

```
yarn add github-reviewers
```

Then in your `package.json` 

```
"reviewer": "github-reviewers",
```

In case you store your `NODE_CONFIG_DIR` in not the default place you can use.

```
"reviewer": "NODE_CONFIG_DIR=./.config yarn github-reviewers",
```