const ExperianJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');

class ExperianExistingAccountScene extends ExperianJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        ecsError: {
          selector: '.ecs-error',
        },
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(
      super.match(),
      this.context('existingAccount'),
    );
  }


  async play() {
    await super.play();
    throw new Error('ExistingAccount');
  }
}

module.exports = ExperianExistingAccountScene;
