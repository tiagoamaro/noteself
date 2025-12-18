require "test_helper"

class NotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @note = notes(:one)
    @user = users(:one)

    sign_in(@user)
  end

  test "should get index" do
    get notes_url
    assert_response :success
  end

  test "should get new" do
    get new_note_url
    assert_response :success
  end

  test "should create note" do
    assert_difference("Note.count") do
      post notes_url, params: { note: { body: @note.body, title: @note.title, user_id: @note.user_id } }
    end

    assert_redirected_to note_url(Note.last)
  end

  test "should show note" do
    get note_url(@note)
    assert_response :success
  end

  test "should get edit" do
    get edit_note_url(@note)
    assert_response :success
  end

  test "should update note" do
    patch note_url(@note), params: { note: { body: @note.body, title: @note.title, user_id: @note.user_id } }
    assert_redirected_to note_url(@note)
  end

  test "should destroy note" do
    assert_difference("Note.count", -1) do
      delete note_url(@note)
    end

    assert_redirected_to notes_url
  end

  # Authorization tests
  test "index should only show notes belonging to current user" do
    other_note = notes(:two)

    get notes_url
    assert_response :success

    # Should only see own notes, not other user's notes
    assert_select "a[href=?]", note_path(@note)
    assert_select "a[href=?]", note_path(other_note), count: 0

    # Verify response body contains current user's note ID but not other user's note ID
    assert_match @note.id.to_s, response.body
    assert_no_match(/note_#{other_note.id}/, response.body)
  end

  test "should not show note belonging to another user" do
    other_note = notes(:two)

    get note_url(other_note)
    assert_redirected_to notes_url
    assert_equal "You don't have permission to access this note.", flash[:alert]
  end

  test "should not get edit for note belonging to another user" do
    other_note = notes(:two)

    get edit_note_url(other_note)
    assert_redirected_to notes_url
    assert_equal "You don't have permission to access this note.", flash[:alert]
  end

  test "should not update note belonging to another user" do
    other_note = notes(:two)
    original_title = other_note.title

    patch note_url(other_note), params: { note: { title: "Hacked Title", body: other_note.body } }
    assert_redirected_to notes_url
    assert_equal "You don't have permission to access this note.", flash[:alert]

    # Verify note was not updated
    other_note.reload
    assert_equal original_title, other_note.title
  end

  test "should not destroy note belonging to another user" do
    other_note = notes(:two)

    assert_no_difference("Note.count") do
      delete note_url(other_note)
    end

    assert_redirected_to notes_url
    assert_equal "You don't have permission to access this note.", flash[:alert]
  end

  test "should show note belonging to current user" do
    get note_url(@note)
    assert_response :success
  end

  test "should get edit for note belonging to current user" do
    get edit_note_url(@note)
    assert_response :success
  end

  test "should update note belonging to current user" do
    patch note_url(@note), params: { note: { title: "Updated Title", body: "Updated Body" } }
    assert_redirected_to note_url(@note)

    @note.reload
    assert_equal "Updated Title", @note.title
    assert_equal "Updated Body", @note.body
  end

  test "should destroy note belonging to current user" do
    assert_difference("Note.count", -1) do
      delete note_url(@note)
    end

    assert_redirected_to notes_url
  end

  test "should return forbidden json when accessing another user's note via json" do
    other_note = notes(:two)

    get note_url(other_note), as: :json
    assert_response :forbidden
    assert_match(/permission/, response.body)
  end
end
