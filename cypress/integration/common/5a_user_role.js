import { loginPage, projectsPage } from "../../support/page_objects/navigation"
import { mainPage } from "../../support/page_objects/mainPage"
import { roles, staticProjects } from "../../support/page_objects/projectConstants"
import { isTestSuiteActive } from "../../support/page_objects/projectConstants"

export const genTest = (type, roleType) => {
    if(!isTestSuiteActive(type, false)) return;

    describe(`User role validation`, () => {

        // project configuration settings
        //
        const advancedSettings = (roleType) => {

            // let validationString = (true == roleValidation[roleIdx].advSettings) ? 'exist' : 'not.exist'
            let validationString = (true == roles[roleType].validations.advSettings) ? 'exist' : 'not.exist'

            // hardwired to be enabled for all roles
            mainPage.navigationDraw(mainPage.AUDIT).should('exist')

            mainPage.navigationDraw(mainPage.APPSTORE).should(validationString)
            mainPage.navigationDraw(mainPage.TEAM_N_AUTH).should(validationString)
            mainPage.navigationDraw(mainPage.PROJ_METADATA).should(validationString)

            // mainPage.navigationDraw(mainPage.ROLE_VIEW).should(validationString)
            if ('exist' == validationString) {
                mainPage.navigationDraw(mainPage.ROLE_VIEW).contains('editor')
                mainPage.navigationDraw(mainPage.ROLE_VIEW).contains('commenter')
                mainPage.navigationDraw(mainPage.ROLE_VIEW).contains('viewer')
            }

            cy.get('button:contains("New User")').should(validationString)
        }


        // Schema related validations
        //  - Add/delete table
        //  - Add/Update/delete column
        //
        const editSchema = (roleType) => {

            let columnName = 'City'
            let validationString = (true == roles[roleType].validations.editSchema) ? 'exist' : 'not.exist'

            // create table options
            //
            cy.get('.add-btn').should(validationString)
            cy.get('.v-tabs-bar').eq(0).find('button.mdi-plus-box').should(validationString)

            // open existing table-column
            //
            cy.openTableTab(columnName)

            // delete table option
            //
            cy.get('.nc-table-delete-btn').should(validationString)

            // add new column option
            //        
            cy.get('.new-column-header').should(validationString)

            // update column (edit/ delete menu)
            //
            cy.get(`th:contains(${columnName}) .mdi-menu-down`).should(validationString)

        }


        // Table data related validations
        //  - Add/delete/modify row
        //
        const editData = (roleType) => {

            let columnName = 'City'
            let validationString = (true == roles[roleType].validations.editData) ? 'exist' : 'not.exist'

            cy.openTableTab(columnName)

            // add new row option (from menu header)
            //
            cy.get('.nc-add-new-row-btn').should(validationString)

            // update row option (right click)
            //
            cy.get(`tbody > :nth-child(8) > [data-col="City"]`).rightclick()

            cy.get('.menuable__content__active').should(validationString)

            if (validationString == 'exist') {

                // right click options will exist (only for 'exist' case)
                //
                cy.getActiveMenu().contains('Insert New Row').should(validationString)
                cy.getActiveMenu().contains('Delete Row').should(validationString)
                cy.getActiveMenu().contains('Delete Selected Rows').should(validationString)
                cy.get('body').type('{esc}')

                // update cell contents option using row expander should be enabled
                //
                //cy.get('.nc-row-expand-icon').eq(4).click({ force: true })
                cy.get('.v-input.row-checkbox').eq(4).next().next().click({ force: true })
                cy.getActiveModal().find('button').contains('Save Row').should('exist')
                cy.get('body').type('{esc}')

            }
            else {
                // update cell contents option using row expander should be disabled
                //
                //cy.get('.nc-row-expand-icon').eq(4).click({ force: true })
                cy.get('.v-input.row-checkbox').eq(4).next().next().click({ force: true })
                cy.getActiveModal().find('button:disabled').contains('Save Row').should('exist')
                cy.get('body').type('{esc}')
            }

            // double click cell entries to edit
            //
            cy.get(`tbody > :nth-child(8) > [data-col="City"]`).dblclick().find('input').should(validationString)
        }


        // read &/ update comment
        //      Viewer: only allowed to read
        //      Everyone else: read &/ update
        //
        const editComment = (roleType) => {

            let columnName = 'City'
            let validationString = (true == roles[roleType].validations.editComment) ? 'Comment added successfully' : 'Not allowed'

            cy.openTableTab(columnName)

            // click on comment icon & type comment
            //

            cy.get('.v-input.row-checkbox').eq(8).next().next().click({ force: true })
            //cy.get('.nc-row-expand-icon').eq(4).click({ force: true })
            cy.getActiveModal().find('.mdi-comment-multiple-outline').should('exist').click()
            cy.getActiveModal().find('.comment-box').type('Comment-1{enter}')

            // Expected response: 
            //      Viewer: Not allowed
            //      Everyone else: Comment added successfully
            //
            cy.get('body').contains(validationString, { timeout: 2000 }).should('exist')
            cy.get('body').type('{esc}')
        }

        // right navigation menu bar
        //      Editor/Viewer/Commenter : can only view 'existing' views
        //      Rest: can create/edit
        const viewMenu = (roleType) => {

            let columnName = 'City'
            let navDrawListCnt = 2
            let navDrawListItemCnt = 5
            cy.openTableTab(columnName)
            let validationString = (true == roles[roleType].validations.shareView) ? 'exist' : 'not.exist'

            // validate if Share button is visible at header tool bar
            cy.get('header.v-toolbar').eq(0).find('button:contains("Share")').should(validationString)

            // Owner, Creator will have two navigation drawer (on each side of center panel)
            if (validationString == 'exist') {
                navDrawListCnt = 4
                navDrawListItemCnt = 13
            }
            cy.get('.v-navigation-drawer__content').eq(1).find('[role="list"]').should('have.length', navDrawListCnt)
            cy.get('.v-navigation-drawer__content').eq(1).find('.v-list-item').should('have.length', navDrawListItemCnt)

            // redundant
            // cy.get('.v-navigation-drawer__content').eq(1).find('.v-list-item').eq(0).contains('Views').should('exist')
            // cy.get('.v-navigation-drawer__content').eq(1).find('.v-list-item').eq(1).contains('City').should('exist')

            // cy.get(`.nc-create-grid-view`).should(validationString)
            // cy.get(`.nc-create-gallery-view`).should(validationString)
        }



        ///////////////////////////////////////////////////////
        // Test suite

        it(`[${roles[roleType].name}] SignIn, Open project`, () => {
            loginPage.signIn(roles[roleType].credentials)
            if('rest' == type)
                projectsPage.openProject(staticProjects.externalREST.basic.name)
            else
                projectsPage.openProject(staticProjects.externalGQL.basic.name)
        })

        it(`[${roles[roleType].name}] Left navigation menu, New User add`, () => {
            advancedSettings(roleType)
        })

        it(`[${roles[roleType].name}] Schema: create table, add/modify/delete column`, () => {
            editSchema(roleType)
        })

        it(`[${roles[roleType].name}] Data: add/modify/delete row, update cell contents`, (/*done*/) => {

            // known issue: to be fixed
            // right click raising alarm 'not allowed' for viewer
            //
            // cy.on('uncaught:exception', (err, runnable) => {
            //     expect(err.message).to.include('Not allowed')
            //     done()
            //     return false
            // })

            if (roleType != 'editor')
                editData(roleType)

            // done()
        })

        it(`[${roles[roleType].name}] Comments: view/add`, () => {

            // Fix me!
            if (roleType != 'viewer')
                editComment(roleType)
        })

        it(`[${roles[roleType].name}] Right navigation menu, share view`, () => {
            viewMenu(roleType)
        })

        after(() => {
            loginPage.loginAndOpenProject(type)
        })
    })
}

// genTest('rest', 'owner')
// genTest('rest', 'creator')
// genTest('rest', 'editor')
// genTest('rest', 'commenter')
// genTest('rest', 'viewer')
// genTest('graphql', 'owner')
// genTest('graphql', 'creator')
// genTest('graphql', 'editor')
// genTest('graphql', 'commenter')
// genTest('graphql', 'viewer')


/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Pranav C Balan <pranavxc@gmail.com>
 * @author Raju Udava <sivadstala@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
