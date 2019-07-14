

## UPDATES

Upload to S3: Bucket name is defined by: `process.env.BUCKET_PREFIX-theater-logs`
Upload to Firebase/Google Cloud Storage: Bucket name is now d
##  Purpose & Inspiration

In a sentence, **Theater automates anything and everything a human being is capable of performing on a site.**

 On the highest level, it achieves this by dealing with units of work as: **Shows & Scenes**.

A show **might describe an entire site, like "Capital One".** Within this show, your scene sets can play - for example: *SignIn* (for linking a user's capital one account using a bot), *ExtractStatements* (for extracting pdf statements from account). Scenes describe how the page looks and you decide what the bot does. It's that simple! I am waiting on permission from Capital One to use this show as a demonstration. ❤️ Note: I cannot endorse violating any terms of use of anything legally speaking, but banks and other usual suspects are often good practice for seeing how well you can evade bot detection techniques. Or so I am told. 👮

Normally, when working with puppeteer, you will find yourself repeatedly calling- `waitForNavigation().` What if there were a way to simply provide the bot what it should see (on the page), and instruct it what to do when such conditions are met?
This is a core value proposition  theater delivers on. By definition, there is no need to call for `waitForNavigation` ever or otherwise wait for anything manually to appear. No more `wait(5000)` dirty code that breaks in production.

Theater also offers extensions: powerful and easy to use tools that can solve problems in two lines of code like recaptcha challenges, generic captchas, clicking all the annoying pop ups that screw up your product because you didn't have the bot know to click them. Read the docs for a detailed description.

Tested & Fully Compatible with both puppeteer@1.17.0 & puppeteer-firefox@0.5.0. Integration with selenium-webdriver is in process.

 **Huge shoutout to original creator, mentor and friend, Juwan Yoo. It was an honor working with you. https://github.com/vhain**
 [Puppeteer docs] (https://pptr.dev/)

There is a lot of work to be done in terms of improving the matching process and contributions are welcome. This project is immature and should not be regarded as something to be used in a production environment without careful consideration.

But seriously, the repo consists of a basic RESTful API interface to demonstrate how it works. My vision for the project is a distributed npm package that can be used to scaffold Shows & Scenes (like a CLI tool). Please reach out if you have experience in this area and want to help!

# # Base Classes

## class: Show


* extends: [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventsemitter)

Example (Bot will login to discover.com)

 ```js
class DiscoverShow extends Show {}
DiscoverShow.Scenes = Show.scenes(path.join(__dirname, 'discover/'));

const bot = new PuppeteerBot({
    preferNonHeadless: true,
});
await bot.init(); // starts the browser
bot.page.goto('https://portal.discover.com/customersvcs/universalLogin/ac_main'); // navigates to our page

const show = new DiscoShow({
      Scenes: DiscoShow.SceneSets.SignIn,
      bot,
      logger, // optional, for custom logger instance
});

show.on('accountLinkedResult', async (o) => { await reporter.onAccountLinkedResult(o); }); // will emit when sign in succeeds

await show.play();

await bot.deinit();
```


###  new Show({ Scenes, bot, timeout })

- `Scenes` <?[Array]<[Class]<[Scene]>>> An array of type `Scene` that might play. `SceneSets` (a basic example) can represent a particular workflow, like Sign In or Extract Reports.

- `bot` <[PuppeteerBot]> A bot that show will play on. Wrapper on top of puppeteer. Goal is to remove this dependency soon.

- `timeout` <[number]> Time for `Show` to give up matching `Scene` (ms). Defaults to 30000.

I am working on a method to improve the timeout feature using a CDP feature that can determine if a given request is driving the page's navigation, in which case the show should not end.



###  Show.scenes(dir)

- `dir` <[string]> Directory to search for `/\.scene\.js$/` files.

- returns: <[Object]<[string], [Class]<[Scene]>>>

- Enumerate files in `dir`, look for all valid `Scene` files and load.



###  show.result()

- returns: TBD

TBD. To return some result.


###  show.scene(TargetScene)

- `TargetScene` <[Class]<[Scene]>>

- returns: <[Promise]<[Scene]>>



If `TargetScene` specified, returns instance of that `Scene` for this show.

If no `TargetScene` specified, this method will returns matching `Scene`.



###  show.play()

- returns: <[Promise]>


This method will play the show. Iterating through out all the `Scenes` and `play()`ing those with `match()`es.

##  class: Scene

This example scene will simply click #session_btn_continue. In the first example using `Scene.Extensions.Click()` and in the second using the basic approach.

```js
class ClickExtendScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        extendSession: {
          selector: '#session_btn_continue',
        },
      },
      extensions: [new Scene.Extensions.Click()],
    }, args));
  }
}

class RequestSessionExtensionScene extends Scene {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        extendSession: {
          selector: '#session_btn_continue',
        },
      },
    }, args));
  }

  async play() {
    await super.play();
    await this.elements.extendSession.click();
  }
}
```

###  new Scene({ show, elementQueries, extensions, generic })

- `show` <[Show]>

- `elementQueries` <[Object]<[string], [PuppeteerBotElementQuery]>>

- `extensions` <[Array]<[SceneExtensions]>>

- `generic` <[boolean]> If this value sets to `false`, conditions should be specified to determine when curtain will fall (ending the show). Defaults to `true`



###  scene.context(key)

- `key` <[string]>



returns `contextVariable[key]`

  ### scene.interaction()
  - returns: <[Interaction]>

###  scene.setContext(key, value)

- `key` <[string]>

- `value` <[\*]>
- sets `var[key] = value`



###  scene.match()

- returns: <[Promise]<[boolean]>>


Criterion for determining whether this `scene` will match (returning `true`) in order:

- Curtain has **NOT** fallen yet

- `PuppeteerBotElement` all elementQueries validated

- `extensions[].match()` all have returned `true`



####  scene.curtainFallen()

- returns: <[Promise]<[boolean]>>



Check if `scene` finished playing; curtain fallen:

- Not `generic` and no `extensions[].curtainFallen()` present in this scene.



####  scene.play()

- returns: <[Promise]>

By default, this method will only call `extensions[].play()`. This is sort of confusing because it means if you are performing some work that needs to precede logic in `play()`, you need to  be invoking the constructor `await super.play()`  before you do your thing. Perfect example (found in the example shows) is captcha authentication. See the Docs.MD file for a detailed and complete reference.





##  class: PuppeteerBotElement



**elementQueries**: A series of selectors and conditionals that describe the state of the page that corresponds to the scene in which they lie.

This basically encapsulates the state of the page. Is this popup blocking the viewport? Is the deposit button visible and did we set the context to contain the coins?  For one use-case I am actually doing this deposit/refill balance flow using  [bitcoinjs-lib] ([https://www.npmjs.com/package/bitcoinjs-lib](https://www.npmjs.com/package/bitcoinjs-lib)).
```js
query = {
  visibility: 'required'|'required:group-name'|'optional'|'forbidden',
  selector: '',
  visibilityAreaCheck: true|false,
}
```

This object (**elementQueries**) will be unique to a particular scene, when the scene is constructed it will target the results and map them into PuppeteerBotElement(s).

- Don't mispell anything - your code will failure and you will spend hours tracking down the visblity that blocked you from proceeding.



- If `visibility` is `'required'`, element will only match if that target element is visible. (Default)

- `'required:group-name'`, match if one of element having same `group-name` is visible. You may specify as many as groups as you want.

- `'optional'`, always match with or without target element visible.

- `'forbidden'`, will only match if target element is not visible.

> `selector` here is any valid CSS selector. CSS makes it easy to adjoin multiple selectors with the logical AND | `,` operator.



####  element.visibleElements()

- returns: <[Promise]<[Array]<[Puppeteer.ElementHandle]>>>


####  element.visible()

- returns: <[Promise]<[boolean]>>

####  element.getFrame()
- Gets the content frame for a given element handle referencing iframe nodes
- returns: <[Promise]<[Frame]>>

####  element.match()
- Checks matching context (elementQuery)
- returns: <[Promise]<[boolean]>>

####  element.innerText()
- returns: <[Promise]<[string]>>

####  element.textContent()
- returns: <[Promise]<[string]>>

####  element.attribute(opt)

- `opt` will be evaluated to retrieve value of this attribute.

- returns: <[Promise]<[string]>>

####  element.fill(opt)

- `opt` will be passed to puppeteer-bot internally.

- returns: <[Promise]<[boolean]>> whether element has been filled or not.

####  element.$select(opt)

- `opt` will be passed to puppeteer-bot internally (dirty-select).

- returns: <[Promise]<[boolean]>> whether element has been selected or not.

####  element.select(opt)

- `opt` will be passed to puppeteer-bot interanlly (default-select).

- returns: <[Promise]<[boolean]>> whether element has been selected or not.

####  element.check(checked)

- `checked` <[boolean]> whether to check or uncheck.
- returns: <[Promise]<[boolean]>> Whether element has been checked successfully or not.

####  element.click({ once } = {})

- `once` <[boolean]> if `true`, will only click very first target element that matches. else, will click all the target elements that match.
- returns: <[Promise]<[boolean]>> whether clicked or not.

####  element.screenshot()

- returns a screenshot of the `first` element matching given elementQuery for given `PupeeteerBotElement`.
- returns: <[Promise]<[Buffer]>> with screenshot file contents.

####  element.upload(file, opt  = {})

- Writes file to temporary directory on disk, uploads file on given elements inside this PuppeteerBotElement, cleans up.
- returns: <[Promise]<[boolean]>> whether file uploaded or not.

####  element.tableContent()

- returns table as an array of JSON objects (`good` for scraping)
- params:

####  element.eval(fn, ...args)

Convenience function to run `puppeteerBot.$$safeEval`. First argument of `fn` will be array of target elements, and from second argument will be `...args`.


## Example Scene (1):


```js
/**
 * Scene will play IFF:
 * - h1 exists
 * - #clickMeFirst or #clickMeNext exists
 * - .spinner is hidden

* Scene play:
 * - if any of h1 element match /click me/,
 * - click all #clickMeFirst if clickable
 * - click all #clickMeSecond if clickable
 */
class TestScene extends Scene {
  constructor() {
    super({ elementQueries: {
      title: {
        visibility: 'required',
        selector: 'h1',
      },
      button1: {
        visibility: 'required:buttons',
        selector: '#clickMeFirst',
      },
      button2: {
        visibility: 'required:buttons',
        selector: '#clickMeNext',
      },
      spinner: {
        visibility: 'forbidden',
        selector: '.spinner',
        visibilityAreaCheck: true,
      },
    }});
  }

  async play() {
    await super.play();
    if (/click me/.test(await this.elements.title.innerText())) {
      this.elements.button1.click();
      this.elements.button2.click();
    }
  }
}
```

## Example Scene (2):
```js
/**
 * Scene will play IFF:
 * - username, password, loginBtn are visible

* Scene play:
 * - check if errors visible, if visible => log details, prevent continous play of this scene when errors are visible
 * - fill: #userid-content,#userid
 * - fill: #password-content,#password
 * - check: #id-checkbox-content,#id-checkbox
 * - click: #log-in-button
 */
class TestScene2 extends Scene {
 constructor(args) {
    super(Object.assign({
    elementQueries: {
      errors: {
        selector: '#info-err-msg',
        visibility: 'optional',
        visibilityAreaCheck: true,
      },
      username: {
        selector: '#userid-content,#userid',
      },
      password: {
        selector: '#password-content,#password',
      },
      rememberMe: {
        selector: '#id-checkbox-content,#id-checkbox',
        visibility: 'optional',
      },
      loginBtn: {
        selector: '#log-in-button',
      },
    }});
  }

  async play() {
   await super.play();
    this.setContinousPlayLimit('errors', 1);

    if (await this.elements.errors.visible()) {
      const errorMessage = await this.elements.errors.innerText();
      this.log('login-error-message: ', errorMessage);
    }

    await this.elements.username.fill(this.context('username'));
    await this.elements.password.fill(this.context('password'));
    await this.elements.rememberMe.check(true);

    await this.elements.loginBtn.click();
  }
}
```



# Scene.Extensions

## class: Scene.Extensions.Click
### new  Scene.Extensions.Click(opt)

-  `opt`  <[string]>  Simply click element by name specified by `opt`.  If left empty, will click all elements.


## class: Scene.Extensions.Delay

### new  Scene.Extensions.Delay(ms)

-  `ms`  <[number]>  Giving a delay for  `ms` (ms). If `ms` left empty, value will be a random `number` between 2000-7500.


##  class: Scene.Extensions.Fork

### new  Scene.Extensions.Fork(forks)

-  `forks`  <[Array]>  fork configurations (managing when a scene itself can be `forked` into multiple options.

```js

new Scene.Extensions.Fork([

{

fork: async() => this.elements.manageStatements.click(),

Scenes: [StatementsSummaryScene, StatementsDetailScene],

},

{

fork: async() => this.elements.accountDetails.click(),

Scenes: [AccountProfileInformationScene, AccountContactInformationScene],

},

]);

```

Use this extension if `Scene` can be forked into multiple options. If a given `Scene` has been matched, a given fork that has `Scene` whose curtain has not fallen will play via `fork.fork()`.

However, if  all `Scene`s' curtain have fallen (show is over), this extension's curtain will also fall.



##  class: Scene.Extensions.PreventCurtainFall

###  new Scene.Extension.PreventCurtainFall({ playCount = 1 })

- `playCount` <[number]> curtain will not fall until this extension played for `playCount` times. If not specified, playCount will default to `1`. This extension is really just a stop-gap for development- as it is sometimes not clear whether or not the bot should continue working. For development, I recommend using it liberally.

##  class: Scene.Extensions.Captcha

 ### new Scene.Extension.Captcha(targetElementName, targetAnswerElementName)

- `targetElementName` is element name of captcha image to solve, `targetAnswerElementName` is element name of captcha solution input field. This extension will solve the captcha and `fill` the solution into targetAnswerElementName. This extension will decide whether to: screenshot element on DOM, get `src` attribute containing base64 image, or  use `rp` to get image from url.

##  class: Scene.Extensions.ReCAPTCHAv2

 ### new Scene.Extension.ReCAPTCHAv2(targetElementName, siteKeyFn)

- `targetElementName` is element name wherein `#g-recaptcha-response` is contained in child nodes of this element. Most often seen as `.g-recaptcha`. This extension will determine site-key from provided `siteKeyFn()`, solve recaptcha, use `getFrame()` if needed to properly set response, and invoke the  callback function (if present) to trigger the result after captcha has been solved.

## Core Components
Some of the syntax within Theater can seem intimidating but it is pretty simple once you understand the underlying components.

- `promise-condition`: supports `or`, `and`, `not`, `strictEqual` nested evaluations for promises. Extremely useful, as illustrated in two examples.

Here the scene will `match()` when either challenge or header is `visible()`. Other puppeteer-bot-element queries **will have no impact** since we have not invoked `super.match()` inside our conditional. The `match()` after shows how that would look.
```js
 async match() {
    return PromiseCondition.or(
      this.elements.challenge.visible(),
      this.elements.header.visible(),
    );
  }

async match() {
    return PromiseCondition.and(
	  super.match(), // now the first is no longer needed
  }
```

Here the scene will `match()` when all puppeteer-bot-element queries have validated, and context `signedIn` has been set to `true`.
```js
  async match() {
    return PromiseCondition.and(
      this.context('signedIn'),
      super.match(),
    );
  }
```

Here is a more complicated example.
```js
async match() {
    return PromiseCondition.and(
      super.match(),
      PromiseCondition.or(
        this.elements.errorMessages.visible(),
        ...Object.keys(this.elements).filter(k => /^input/.test(k)).map(e => PromiseCondition.and(
          this.elements[e].visible(),
          PromiseCondition.not(this.elements[e].value()),
        )),
      ),
    );
  }
```

- `Interaction`:  At some point you may find yourself needing to provide some information a bot after it has already begun running (anytime you require input after the bot initializes). Perhaps you need to prompt for a security question's answer, code, etc. Interaction is a very simple class that uses `Redis` to maintain a real-time interaction link between the user and the bot.
-
Credits to @vhain, who wrote this code.

You will find a basic React boilerplate that demonstrates how this works (see `classes/theater/shows/jokerstash`) for an example of interaction being used to communicate with a user to search for their information.


## Common Design Patterns

When working with complex automation tasks, I've found setting up a few boilerplate Scenes before I do anything else saves me a lot of time.
These scenes are:

 - JustClickAwareScene (exports `JustClickAwareScene.WithSpinner`,
   `JustClickAwareScene.WithoutSpinner `

 - JustClickScene: will just-click any selector specified - perfect for
   closing annoying modals, CTAs, extending session, etc

 - SpinnerAwareScene: (will wait for any spinners/loading modals to
   dissapear before continuing to`play()` the Show.

You can find some real-examples of this in the `classes/theater/shows` folder.

## Test Driven Development

These modular nature of Theater lends itself well to a TDD approach - for each particular Scene just grab the html for that page and add a test assertion in `show-tests/example` folder where `example` is your Show name. I'm looking to improve the way I'm currently handling the test setup & tear down with puppeteer. In conclusion, this project is in its infancy but it holds a great deal of promise for those immersed in web automation and scraping. I welcome any and all criticism or comments and will be contributing reguarly.

## Contributing "rules"
This is my first real open-source project that I'll be maintaining, I'd love contributions, questions, criticism, or guidance!

## Contact
nicokokonas@mindwise.io

[https://webscrapers.slack.com](https://webscrapers.slack.com/) for a prompt response, message me here!


<!--stackedit_data:
eyJoaXN0b3J5IjpbNjQxOTQxMjI3LDkyNTc0MzUxNSwxMTA1OT
M4NDAzLDc2NjY3Mjk5MCwxMDc3ODYwOTIwLC0xNzA4ODg5NjY1
LC0xODkwMjExODE2LC0xMTU3NjAzNzI0LC0xOTEwNzIwNDJdfQ
==
-->
