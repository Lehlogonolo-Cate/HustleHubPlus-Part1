const express = require('express');

const { ROLES } = require('../constants');
const gigs = require('../controllers/gigController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.use(authenticate);

// Order matters: /mine must be registered before /:id
router.get('/', validate(rules.listGigs), gigs.list);
router.get('/mine', authorize(ROLES.FREELANCER), gigs.listMine);
router.get('/:id', validate([rules.idParam]), gigs.getOne);
router.post('/', authorize(ROLES.FREELANCER), validate(rules.createGig), gigs.create);
// The role check lets freelancers in; the service's ownership check limits them to their own gigs
router.patch('/:id', authorize(ROLES.FREELANCER), validate(rules.updateGig), gigs.update);
router.delete('/:id', authorize(ROLES.FREELANCER, ROLES.ADMIN), validate([rules.idParam]), gigs.remove);

module.exports = router;
